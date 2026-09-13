import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/shared/api";

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
  onlyOpen?: boolean;
  cursor?: string;
  limit?: number;
};

export type ListJobPostingsResult = {
  rows: JobPosting[];
  total: number;
  nextCursor: string | null;
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
      career_level: input.careerLevel ?? null,
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

  const limit = opts.limit ?? 20;
  const today = new Date().toISOString().slice(0, 10);
  let query = supabase
    .from("job_postings")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  const q = opts.q?.trim();
  if (q) {
    query = query.or(
      `company_name_raw.ilike.%${escapeLike(q)}%,role.ilike.%${escapeLike(q)}%`
    );
  }
  if (opts.employmentType) {
    query = query.eq("employment_type", opts.employmentType);
  }
  if (opts.source) {
    query = query.eq("source", opts.source);
  }
  if (opts.onlyOpen) {
    query = query.or(`deadline.is.null,deadline.gte.${today}`);
  }

  const parsedCursor = parseCursor(opts.cursor);
  if (parsedCursor) {
    query = query.or(
      `created_at.lt.${parsedCursor.createdAt},and(created_at.eq.${parsedCursor.createdAt},id.lt.${parsedCursor.id})`
    );
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  const rows = data.map(mapRow);
  const last = rows.at(-1);
  return {
    rows,
    total: count ?? rows.length,
    nextCursor: rows.length === limit && last ? formatCursor(last) : null
  };
}

function formatCursor(posting: JobPosting): string {
  return Buffer.from(`${posting.createdAt}\n${posting.id}`, "utf8").toString(
    "base64url"
  );
}

function parseCursor(
  cursor: string | undefined
): { createdAt: string; id: string } | null {
  if (!cursor) return null;
  try {
    const [createdAt, id] = Buffer.from(cursor, "base64url")
      .toString("utf8")
      .split("\n");
    return createdAt && id ? { createdAt, id } : null;
  } catch {
    return null;
  }
}

function escapeLike(value: string): string {
  return value.replace(/[%_]/g, (char) => `\\${char}`);
}
