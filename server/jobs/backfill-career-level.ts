/**
 * career_level 백필 스크립트.
 *
 *   pnpm exec tsx --env-file=.env.local server/jobs/backfill-career-level.ts
 *   pnpm exec tsx --env-file=.env.local server/jobs/backfill-career-level.ts --apply
 */

import { extractCareerLevel } from "../job-postings/career-level";
import { type CareerLevel } from "../job-postings/types";
import { createAdminClient } from "../supabase/admin";

const DO_APPLY = process.argv.includes("--apply");
const PAGE_SIZE = 500;

type PostingRow = {
  id: string;
  role: string;
  raw_text: string | null;
  career_level: string | null;
};

type CandidateRow = PostingRow & { extracted: CareerLevel };

async function main(): Promise<void> {
  const admin = createAdminClient();
  const rows: PostingRow[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await admin
      .from("job_postings")
      .select("id, role, raw_text, career_level")
      .is("career_level", null)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  const candidates: CandidateRow[] = rows
    .map((row) => ({
      ...row,
      extracted: extractCareerLevel(`${row.role} ${row.raw_text ?? ""}`)
    }))
    .filter((row): row is CandidateRow => row.extracted !== null);

  const distribution = new Map<string, number>();
  for (const row of candidates) {
    distribution.set(row.extracted, (distribution.get(row.extracted) ?? 0) + 1);
  }

  console.log(`대상: ${rows.length}건`);
  console.log(`${DO_APPLY ? "업데이트" : "업데이트 후보"}: ${candidates.length}건`);
  console.log("분포:");
  for (const [level, count] of distribution) {
    console.log(`  - ${level}: ${count}`);
  }

  console.log("\n샘플:");
  for (const row of candidates.slice(0, 20)) {
    console.log(`  - ${row.extracted}: ${row.role}`);
  }

  if (!DO_APPLY) {
    console.log("\nDry-run: 업데이트 안 함. 실제 반영하려면 --apply.");
    return;
  }

  let updated = 0;
  for (const row of candidates) {
    const { error } = await admin
      .from("job_postings")
      .update({ career_level: row.extracted })
      .eq("id", row.id);
    if (error) throw error;
    updated += 1;
  }

  console.log(`\n업데이트 완료: ${updated}건`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
