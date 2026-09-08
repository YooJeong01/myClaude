import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AnalysisSources,
  CompanyAnalysisResult
} from "@server/analysis/types";

import type { Database, Json } from "@/shared/api";

import type { CompanyAnalysis, CompanyAnalysisSummary } from "./model";

type CompanyAnalysisRow =
  Database["public"]["Tables"]["company_analyses"]["Row"];

type CompanyRelation = {
  companies: { name: string } | null;
};

type CompanyAnalysisJoinedRow = CompanyAnalysisRow & CompanyRelation;

const analysisSelect = "*, companies(name)";

function companyNameFromRow(row: CompanyAnalysisJoinedRow): string {
  return row.companies?.name ?? "회사명 미확인";
}

function mapRow(row: CompanyAnalysisJoinedRow): CompanyAnalysis {
  return {
    id: row.id,
    companyId: row.company_id,
    companyName: companyNameFromRow(row),
    role: row.role,
    jobPostingId: row.job_posting_id,
    result: row.result as unknown as CompanyAnalysisResult,
    sources: row.sources as unknown as AnalysisSources,
    model: row.model,
    createdAt: row.created_at
  };
}

function mapSummary(row: CompanyAnalysisJoinedRow): CompanyAnalysisSummary {
  return {
    id: row.id,
    companyId: row.company_id,
    companyName: companyNameFromRow(row),
    role: row.role,
    jobPostingId: row.job_posting_id,
    createdAt: row.created_at
  };
}

/** RLS가 현재 사용자의 분석만 노출한다. */
export async function listAnalysesForCompany(
  supabase: SupabaseClient<Database>,
  companyId: string
): Promise<CompanyAnalysisSummary[]> {
  const { data, error } = await supabase
    .from("company_analyses")
    .select(analysisSelect)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .returns<CompanyAnalysisJoinedRow[]>();

  if (error) {
    throw error;
  }
  return data.map(mapSummary);
}

/** RLS가 현재 사용자의 분석만 노출한다. */
export async function listRecentAnalyses(
  supabase: SupabaseClient<Database>
): Promise<CompanyAnalysisSummary[]> {
  const { data, error } = await supabase
    .from("company_analyses")
    .select(analysisSelect)
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<CompanyAnalysisJoinedRow[]>();

  if (error) {
    throw error;
  }
  return data.map(mapSummary);
}

/** RLS가 현재 사용자의 분석만 노출한다. */
export async function getAnalysis(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<CompanyAnalysis | null> {
  const { data, error } = await supabase
    .from("company_analyses")
    .select(analysisSelect)
    .eq("id", id)
    .maybeSingle()
    .returns<CompanyAnalysisJoinedRow | null>();

  if (error) {
    throw error;
  }
  return data ? mapRow(data) : null;
}

export type AnalysisJson = Json;
