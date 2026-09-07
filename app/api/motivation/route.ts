import { NextResponse, type NextRequest } from "next/server";

import type { CompanyAnalysisResult } from "@server/analysis/types";
import { LlmError } from "@server/llm/errors";
import { generateMotivation } from "@server/motivation/generate";
import type { Json } from "@server/supabase/types";

import { UnauthorizedError, requireUser } from "@/entities/session";
import { createSupabaseServerClient } from "@/shared/api-server";

export const runtime = "nodejs";

interface MotivationBody {
  company_analysis_id?: string;
  experience_ids?: string[];
  role?: string;
}

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

  let body: MotivationBody;
  try {
    body = (await req.json()) as MotivationBody;
  } catch {
    return NextResponse.json({ error: "JSON 본문을 읽지 못했습니다." }, { status: 400 });
  }

  const companyAnalysisId = body.company_analysis_id?.trim();
  const experienceIds = Array.isArray(body.experience_ids)
    ? body.experience_ids.map((id) => id.trim()).filter(Boolean)
    : [];

  if (!companyAnalysisId) {
    return NextResponse.json(
      { error: "company_analysis_id 가 필요합니다." },
      { status: 400 }
    );
  }
  if (experienceIds.length === 0) {
    return NextResponse.json(
      { error: "experience_ids 는 1개 이상 필요합니다." },
      { status: 400 }
    );
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { data: analysisRow, error: analysisError } = await supabase
      .from("company_analyses")
      .select("*")
      .eq("id", companyAnalysisId)
      .maybeSingle();
    if (analysisError) {
      throw new Error(`company_analyses 조회 실패: ${analysisError.message}`);
    }
    if (!analysisRow) {
      return NextResponse.json(
        { error: "기업분석 결과를 찾지 못했습니다." },
        { status: 404 }
      );
    }

    const { data: companyRow, error: companyError } = await supabase
      .from("companies")
      .select("name")
      .eq("id", analysisRow.company_id)
      .single();
    if (companyError) {
      throw new Error(`companies 조회 실패: ${companyError.message}`);
    }

    const { data: experiences, error: experiencesError } = await supabase
      .from("user_experiences")
      .select("id, title, body")
      .in("id", experienceIds);
    if (experiencesError) {
      throw new Error(`user_experiences 조회 실패: ${experiencesError.message}`);
    }
    if ((experiences?.length ?? 0) !== experienceIds.length) {
      return NextResponse.json(
        { error: "요청한 경험 중 조회할 수 없는 항목이 있습니다." },
        { status: 400 }
      );
    }

    const role = body.role?.trim() || analysisRow.role;
    const { result, model } = await generateMotivation({
      role,
      companyName: companyRow.name,
      analysis: analysisRow.result as unknown as CompanyAnalysisResult,
      experiences: experiences.map((experience) => ({
        title: experience.title,
        body: experience.body
      }))
    });

    const { data: draft, error: insertError } = await supabase
      .from("motivation_drafts")
      .insert({
        user_id: user.id,
        company_analysis_id: analysisRow.id,
        job_posting_id: analysisRow.job_posting_id,
        experience_ids: experienceIds,
        result: result as unknown as Json,
        model
      })
      .select("*")
      .single();
    if (insertError) {
      throw new Error(`motivation_drafts insert 실패: ${insertError.message}`);
    }

    return NextResponse.json({ draft });
  } catch (err) {
    return errorResponse(err);
  }
}

function errorResponse(err: unknown): NextResponse {
  if (err instanceof LlmError) {
    const status =
      err.code === "RATE_LIMITED" ? 429 : err.code === "NO_API_KEY" ? 500 : 502;
    return NextResponse.json({ error: err.message, code: err.code }, { status });
  }
  console.error("[/api/motivation]", err);
  return NextResponse.json(
    { error: "지원동기 매칭 중 오류가 발생했습니다." },
    { status: 500 }
  );
}
