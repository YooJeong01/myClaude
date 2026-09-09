/**
 * 기존 job_postings 를 직무 필터로 재분류한다.
 *
 *   pnpm exec tsx --env-file=.env.local server/jobs/audit-postings.ts            # dry-run (분류 리포트만)
 *   pnpm exec tsx --env-file=.env.local server/jobs/audit-postings.ts --delete   # irrelevant 실제 삭제
 *
 * --delete 는 "irrelevant" 로 분류된 행만 지운다. "review"(확인 필요)는 남긴다.
 */
import {
  classifyRole,
  type RoleRelevance
} from "../scraping/common/role-filter";
import { createAdminClient } from "../supabase/admin";

const DO_DELETE = process.argv.includes("--delete");

async function main(): Promise<void> {
  const admin = createAdminClient();

  const rows: {
    id: string;
    company_name_raw: string | null;
    role: string;
    raw_text: string | null;
    url: string | null;
  }[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin
      .from("job_postings")
      .select("id, company_name_raw, role, raw_text, url")
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < pageSize) break;
  }

  const buckets: Record<RoleRelevance, typeof rows> = {
    relevant: [],
    review: [],
    irrelevant: []
  };
  for (const row of rows) {
    buckets[classifyRole(row.role, row.raw_text ?? undefined)].push(row);
  }

  console.log(`전체: ${rows.length}건`);
  console.log(`  relevant   ${buckets.relevant.length}`);
  console.log(`  review     ${buckets.review.length}  (확인 필요 — 남김)`);
  console.log(`  irrelevant ${buckets.irrelevant.length}  (${DO_DELETE ? "삭제 대상" : "삭제 후보"})`);

  for (const bucket of ["review", "irrelevant"] as const) {
    console.log(`\n[${bucket}] 샘플 15건:`);
    for (const row of buckets[bucket].slice(0, 15)) {
      const role = row.role.replace(/\s+/g, " ").trim().slice(0, 50);
      console.log(`  - ${row.company_name_raw ?? "?"} / ${role}`);
    }
  }

  if (!DO_DELETE) {
    console.log("\nDry-run: 삭제 안 함. 실제로 지우려면 --delete.");
    return;
  }

  const ids = buckets.irrelevant.map((r) => r.id);
  let deleted = 0;
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const { error } = await admin.from("job_postings").delete().in("id", chunk);
    if (error) throw error;
    deleted += chunk.length;
  }
  console.log(`\n✅ irrelevant ${deleted}건 삭제 완료. relevant ${buckets.relevant.length} + review ${buckets.review.length} 유지.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
