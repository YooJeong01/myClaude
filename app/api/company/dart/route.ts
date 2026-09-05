import { NextResponse, type NextRequest } from "next/server";

import { UnauthorizedError, requireUser } from "@/entities/session";
import { createAdminClient } from "@server/supabase/admin";
import { fetchCompanyProfile, fetchKeyFinancials } from "@server/dart/client";
import { resolveCorp } from "@server/dart/corp-codes";
import { DartApiError } from "@server/dart/types";

export const runtime = "nodejs";

/**
 * GET /api/company/dart?corp=<회사명>[&year=<사업연도>]
 * GET /api/company/dart?corp_code=<8자리>
 *
 * 로그인 확인 후 corp_code를 해석하고 DART 기업개황 + 주요 재무를 조회한다.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await requireUser();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }

  const { searchParams } = req.nextUrl;
  const corp = searchParams.get("corp")?.trim();
  const corpCodeParam = searchParams.get("corp_code")?.trim();
  const yearParam = searchParams.get("year")?.trim();

  const lookup = corpCodeParam || corp;
  if (!lookup) {
    return NextResponse.json(
      { error: "corp(회사명) 또는 corp_code 쿼리 파라미터가 필요합니다." },
      { status: 400 }
    );
  }

  const year = yearParam ? Number(yearParam) : undefined;
  if (year !== undefined && (!Number.isInteger(year) || year < 2015)) {
    return NextResponse.json(
      { error: "year는 2015 이상의 정수여야 합니다." },
      { status: 400 }
    );
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

    const [company, financials] = await Promise.all([
      fetchCompanyProfile(match.corpCode),
      fetchKeyFinancials(match.corpCode, { year })
    ]);

    return NextResponse.json({
      resolved: match,
      candidates: candidates.length > 1 ? candidates : undefined,
      company,
      financials
    });
  } catch (err) {
    if (err instanceof DartApiError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: statusFor(err) }
      );
    }
    console.error("[/api/company/dart]", err);
    return NextResponse.json(
      { error: "기업 정보 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

function statusFor(err: DartApiError): number {
  switch (err.code) {
    case "NO_API_KEY":
      return 500;
    case "NO_DATA":
      return 404;
    case "RATE_LIMITED":
      return 429;
    case "INVALID_KEY":
    case "DART_ERROR":
    case "HTTP_ERROR":
      return 502;
    default:
      return 502;
  }
}
