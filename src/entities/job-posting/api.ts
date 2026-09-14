import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/shared/api";

import { extractCareerLevel } from "@server/job-postings/career-level";
import { endOfDayKstToIso } from "@server/job-postings/kst-deadline";
import type {
  CareerLevel,
  EmploymentType,
  JobPosting,
  NewJobPostingInput
} from "./model";

type JobPostingRow = Database["public"]["Tables"]["job_postings"]["Row"];

export type ListJobPostingsOptions = {
  q?: string;
  employmentType?: EmploymentType;
  careerLevel?: CareerLevel;
  source?: string;
  showClosed?: boolean;
  onlyClosed?: boolean;
  page?: number;
  limit?: number;
};

export type ListJobPostingsResult = {
  rows: JobPosting[];
  total: number;
  page: number;
  totalPages: number;
};

function mapRow(row: JobPostingRow): JobPosting {
  return {
    id: row.id,
    companyNameRaw: row.company_name_raw,
    role: row.role,
    employmentType: row.employment_type as EmploymentType,
    careerLevel: row.career_level as CareerLevel | null,
    postedAt: row.posted_at,
    deadline: row.deadline,
    source: row.source,
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
      career_level:
        input.careerLevel ??
        extractCareerLevel(`${input.role} ${input.rawText ?? ""}`),
      posted_at: input.postedAt || null,
      deadline: input.deadline ? endOfDayKstToIso(input.deadline) : null,
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
): Promise<JobPosting[]>;
export async function listJobPostings(
  supabase: SupabaseClient<Database>,
  opts: ListJobPostingsOptions
): Promise<ListJobPostingsResult>;
export async function listJobPostings(
  supabase: SupabaseClient<Database>,
  opts?: ListJobPostingsOptions
): Promise<JobPosting[] | ListJobPostingsResult> {
  if (!opts) {
    const { data, error } = await supabase
      .from("job_postings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }
    return data.map(mapRow);
  }

  const limit = opts.limit ?? 10;
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const now = new Date().toISOString();
  let query = supabase
    .from("job_postings")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  const q = opts.q?.trim();
  if (q) {
    query = query.or(
      `company_name_raw.ilike.%${escapeLike(q)}%,role.ilike.%${escapeLike(q)}%`
    );
  }
  if (opts.employmentType) {
    query = query.eq("employment_type", opts.employmentType);
  }
  if (opts.careerLevel) {
    query = query.eq("career_level", opts.careerLevel);
  }
  if (opts.source) {
    query = query.eq("source", opts.source);
  }
  if (opts.onlyClosed) {
    query = query.lt("deadline", now);
  } else if (!opts.showClosed) {
    query = query.or(`deadline.is.null,deadline.gte.${now}`);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  const rows = data.map(mapRow);
  const total = count ?? rows.length;
  return {
    rows,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

function escapeLike(value: string): string {
  return value.replace(/[%_]/g, (char) => `\\${char}`);
}
