/**
 * 기업분석 DB 쓰기.
 *
 * companies 는 전체 공유 레퍼런스라 service-role 로만 쓴다(RLS).
 * company_analyses 는 불변 이력 — 덮어쓰지 않고 매번 insert (goal.md).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { DartCompanyProfile } from "../dart/types";
import type { Database, Json } from "../supabase/types";
import type { AnalysisSources, CompanyAnalysisResult } from "./types";

type Admin = SupabaseClient<Database>;
type CompanyAnalysisRow = Database["public"]["Tables"]["company_analyses"]["Row"];

/** DART 개황으로 companies 행을 만들거나 갱신하고 id 를 돌려준다. */
export async function upsertCompany(
  admin: Admin,
  profile: DartCompanyProfile
): Promise<string> {
  const { data, error } = await admin
    .from("companies")
    .upsert(
      {
        corp_code: profile.corpCode,
        name: profile.corpName,
        stock_code: profile.stockCode,
        industry: profile.industryCode,
        // public_data 는 유연 저장 슬롯 — 개황 원본을 통째로.
        public_data: profile as unknown as Json
      },
      { onConflict: "corp_code" }
    )
    .select("id")
    .single();

  if (error) {
    throw new Error(`companies upsert 실패: ${error.message}`);
  }
  return data.id;
}

export interface InsertAnalysisParams {
  userId: string;
  companyId: string;
  role: string;
  jobPostingId?: string | null;
  result: CompanyAnalysisResult;
  sources: AnalysisSources;
  model: string;
}

export async function insertCompanyAnalysis(
  admin: Admin,
  params: InsertAnalysisParams
): Promise<CompanyAnalysisRow> {
  const { data, error } = await admin
    .from("company_analyses")
    .insert({
      user_id: params.userId,
      company_id: params.companyId,
      role: params.role,
      job_posting_id: params.jobPostingId ?? null,
      // result/sources 는 jsonb — 구조는 server/analysis/types.ts 가 소유한다.
      result: params.result as unknown as Json,
      sources: params.sources as unknown as Json,
      model: params.model
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`company_analyses insert 실패: ${error.message}`);
  }
  return data;
}
