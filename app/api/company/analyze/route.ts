import { NextResponse, type NextRequest } from "next/server";

import { collectCompanySources } from "@server/analysis/collect";
import { insertCompanyAnalysis, upsertCompany } from "@server/analysis/persist";
import { synthesizeCompanyAnalysis } from "@server/analysis/synthesize";
import { resolveCorp } from "@server/dart/corp-codes";
import { DartApiError } from "@server/dart/types";
import { HankyungScrapeError } from "@server/hankyung/http";
import { LlmError } from "@server/llm/errors";
import { createAdminClient } from "@server/supabase/admin";

import { UnauthorizedError, requireUser } from "@/entities/session";

export const runtime = "nodejs";

interface AnalyzeBody {
  corp?: string;
  corp_code?: string;
  role?: string;
  job_posting_id?: string;
}

/**
 * POST /api/company/analyze
 * body: { corp?: 회사명, corp_code?: 8자리, role: 직무, job_posting_id?: uuid }
 *
 * 로그인 확인 → corp 해석 → companies upsert → DART·뉴스·컨센서스 병렬 수집
 * → Gemini 종합 → company_analyses 이력 삽입.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let user;
  try {
    user = await requireUser();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }

  let body: AnalyzeBody;
  try {
    body = (await req.json()) as AnalyzeBody;
  } catch {
    return NextResponse.json({ error: "JSON 본문을 읽지 못했습니다." }, { status: 400 });
  }

  const lookup = body.corp_code?.trim() || body.corp?.trim();
  const role = body.role?.trim();
  if (!lookup) {
    return NextResponse.json(
      { error: "corp(회사명) 또는 corp_code 가 필요합니다." },
      { status: 400 }
    );
  }
  if (!role) {
    return NextResponse.json({ error: "role(직무) 이 필요합니다." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    const { match, candidates } = await resolveCorp(admin, lookup);
    if (!match) {
      return NextResponse.json(
        { error: `'${lookup}'에 해당하는 기업을 찾지 못했습니다.`, candidates },
        { status: 404 }
      );
    }

    const sources = await collectCompanySources(match.corpCode, match.corpName);
    const companyId = await upsertCompany(admin, sources.profile);

    const { result, sources: analysisSources, model } = await synthesizeCompanyAnalysis({
      role,
      profile: sources.profile,
      financials: sources.financials,
      news: sources.news,
      reports: sources.reports
    });

    const saved = await insertCompanyAnalysis(admin, {
      userId: user.id,
      companyId,
      role,
      jobPostingId: body.job_posting_id?.trim() || null,
      result,
      sources: analysisSources,
      model
    });

    return NextResponse.json({
      resolved: match,
      candidates: candidates.length > 1 ? candidates : undefined,
      analysis: saved
    });
  } catch (err) {
    return errorResponse(err);
  }
}

function errorResponse(err: unknown): NextResponse {
  if (err instanceof DartApiError) {
    const status = err.code === "NO_DATA" ? 404 : err.code === "RATE_LIMITED" ? 429 : 502;
    return NextResponse.json({ error: err.message, code: err.code }, { status });
  }
  if (err instanceof LlmError) {
    const status =
      err.code === "RATE_LIMITED" ? 429 : err.code === "NO_API_KEY" ? 500 : 502;
    return NextResponse.json({ error: err.message, code: err.code }, { status });
  }
  if (err instanceof HankyungScrapeError) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
  console.error("[/api/company/analyze]", err);
  return NextResponse.json(
    { error: "기업분석 중 오류가 발생했습니다." },
    { status: 500 }
  );
}
