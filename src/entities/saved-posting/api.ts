import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/shared/api";

import type { SavedPosting, SavedPostingWithDetail } from "./model";

type SavedPostingRow = Database["public"]["Tables"]["saved_postings"]["Row"];
type JobPostingRow = Database["public"]["Tables"]["job_postings"]["Row"];
type SavedPostingJoinedRow = SavedPostingRow & {
  job_postings: JobPostingRow | null;
};

function mapSaved(row: SavedPostingRow): SavedPosting {
  return {
    id: row.id,
    userId: row.user_id,
    jobPostingId: row.job_posting_id,
    createdAt: row.created_at
  };
}

function mapPosting(row: JobPostingRow): SavedPostingWithDetail["posting"] {
  return {
    id: row.id,
    companyNameRaw: row.company_name_raw,
    role: row.role,
    employmentType: row.employment_type as SavedPostingWithDetail["posting"]["employmentType"],
    postedAt: row.posted_at,
    deadline: row.deadline,
    url: row.url,
    rawText: row.raw_text,
    createdAt: row.created_at
  };
}

/** RLS가 현재 사용자의 saved_postings만 노출한다. */
export async function listSavedPostingIds(
  supabase: SupabaseClient<Database>
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("saved_postings")
    .select("job_posting_id");

  if (error) {
    throw error;
  }

  return new Set(data.map((row) => row.job_posting_id));
}

/** RLS가 현재 사용자의 saved_postings만 노출한다. */
export async function listSavedPostingsWithDetail(
  supabase: SupabaseClient<Database>
): Promise<SavedPostingWithDetail[]> {
  const { data, error } = await supabase
    .from("saved_postings")
    .select("*, job_postings(*)")
    .order("created_at", { ascending: false })
    .returns<SavedPostingJoinedRow[]>();

  if (error) {
    throw error;
  }

  return data.flatMap((row) =>
    row.job_postings
      ? [{ ...mapSaved(row), posting: mapPosting(row.job_postings) }]
      : []
  );
}

export async function addSaved(
  supabase: SupabaseClient<Database>,
  userId: string,
  jobPostingId: string
): Promise<SavedPosting> {
  const { data, error } = await supabase
    .from("saved_postings")
    .insert({
      user_id: userId,
      job_posting_id: jobPostingId
    })
    .select()
    .single();

  if (error) {
    throw error;
  }
  return mapSaved(data);
}

export async function removeSaved(
  supabase: SupabaseClient<Database>,
  jobPostingId: string
): Promise<void> {
  const { error } = await supabase
    .from("saved_postings")
    .delete()
    .eq("job_posting_id", jobPostingId);

  if (error) {
    throw error;
  }
}
