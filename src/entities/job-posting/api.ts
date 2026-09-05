import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/shared/api";

import type { EmploymentType, JobPosting, NewJobPostingInput } from "./model";

type JobPostingRow = Database["public"]["Tables"]["job_postings"]["Row"];

function mapRow(row: JobPostingRow): JobPosting {
  return {
    id: row.id,
    companyNameRaw: row.company_name_raw,
    role: row.role,
    employmentType: row.employment_type as EmploymentType,
    postedAt: row.posted_at,
    deadline: row.deadline,
    url: row.url,
    rawText: row.raw_text,
    createdAt: row.created_at
  };
}

export async function insertJobPosting(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: NewJobPostingInput
): Promise<JobPosting> {
  const { data, error } = await supabase
    .from("job_postings")
    .insert({
      user_id: userId,
      company_name_raw: input.companyNameRaw?.trim() || null,
      role: input.role.trim(),
      employment_type: input.employmentType,
      posted_at: input.postedAt || null,
      deadline: input.deadline || null,
      source: "manual",
      url: input.url?.trim() || null,
      raw_text: input.rawText?.trim() || null
    })
    .select()
    .single();

  if (error) {
    throw error;
  }
  return mapRow(data);
}

/** RLS가 `user_id = auth.uid()`로 필터링하므로 별도 where 절이 필요 없다. */
export async function listJobPostings(
  supabase: SupabaseClient<Database>
): Promise<JobPosting[]> {
  const { data, error } = await supabase
    .from("job_postings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }
  return data.map(mapRow);
}
