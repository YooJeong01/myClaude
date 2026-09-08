import type { SupabaseClient } from "@supabase/supabase-js";
import type { MotivationResult } from "@server/motivation/types";

import type { Database } from "@/shared/api";

import type { MotivationDraft, MotivationDraftSummary } from "./model";

type MotivationDraftRow =
  Database["public"]["Tables"]["motivation_drafts"]["Row"];

function mapRow(row: MotivationDraftRow): MotivationDraft {
  return {
    id: row.id,
    companyAnalysisId: row.company_analysis_id,
    jobPostingId: row.job_posting_id,
    experienceIds: row.experience_ids,
    result: row.result as unknown as MotivationResult,
    model: row.model,
    createdAt: row.created_at
  };
}

function mapSummary(row: MotivationDraftRow): MotivationDraftSummary {
  return {
    id: row.id,
    companyAnalysisId: row.company_analysis_id,
    experienceIds: row.experience_ids,
    createdAt: row.created_at
  };
}

/** RLS가 현재 사용자의 draft만 노출한다. */
export async function listDraftsForAnalysis(
  supabase: SupabaseClient<Database>,
  companyAnalysisId: string
): Promise<MotivationDraftSummary[]> {
  const { data, error } = await supabase
    .from("motivation_drafts")
    .select("*")
    .eq("company_analysis_id", companyAnalysisId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }
  return data.map(mapSummary);
}

/** RLS가 현재 사용자의 draft만 노출한다. */
export async function getDraft(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<MotivationDraft | null> {
  const { data, error } = await supabase
    .from("motivation_drafts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data ? mapRow(data) : null;
}
