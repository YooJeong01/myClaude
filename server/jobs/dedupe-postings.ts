/**
 * 크로스-사이트 중복 공고를 리포트한다.
 *
 *   pnpm exec tsx --env-file=.env.local server/jobs/dedupe-postings.ts            # dry-run
 *   pnpm exec tsx --env-file=.env.local server/jobs/dedupe-postings.ts --delete   # 중복군에서 최신 1건만 남김
 */
import { createAdminClient } from "../supabase/admin";

const DO_DELETE = process.argv.includes("--delete");

type PostingRow = {
  id: string;
  user_id: string;
  company_name_raw: string | null;
  company_key: string;
  role: string;
  role_norm: string;
  employment_type: string;
  posted_at: string | null;
  source: string;
  url: string | null;
  created_at: string;
};

function normalizeCompanyName(value: string | null): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/주식회사|㈜|\(주\)|\(유\)|유한회사|\binc\.?|\bcorp\.?|\bco\.?|\bltd\.?|\bllc|\s/g, "");
}

// 최소 정규화만: 소문자 + 공백 정리. (괄호·수식어를 지우면 "(3~5년)"·"(신입)" 같은
// 의미 있는 구분이 사라져 다른 공고가 합쳐진다 — day7.md D5.)
function normalizeRole(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function dedupeKey(row: PostingRow): string {
  return [
    row.user_id,
    normalizeCompanyName(row.company_name_raw),
    normalizeRole(row.role),
    row.employment_type,
    row.posted_at ?? ""
  ].join("\u001f");
}

function compareNewestFirst(a: PostingRow, b: PostingRow): number {
  const byCreated = b.created_at.localeCompare(a.created_at);
  if (byCreated !== 0) return byCreated;
  return b.id.localeCompare(a.id);
}

async function main(): Promise<void> {
  const admin = createAdminClient();

  const rows: PostingRow[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin
      .from("job_postings")
      .select("id, user_id, company_name_raw, company_key, role, role_norm, employment_type, posted_at, source, url, created_at")
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < pageSize) break;
  }

  const groups = new Map<string, PostingRow[]>();
  for (const row of rows) {
    const key = dedupeKey(row);
    const bucket = groups.get(key) ?? [];
    bucket.push(row);
    groups.set(key, bucket);
  }

  const duplicateGroups = [...groups.values()]
    .filter((group) => group.length > 1)
    .map((group) => group.sort(compareNewestFirst))
    .sort((a, b) => b.length - a.length);

  const duplicateRows = duplicateGroups.reduce((sum, group) => sum + group.length - 1, 0);

  console.log(`전체: ${rows.length}건`);
  console.log(`중복군: ${duplicateGroups.length}개`);
  console.log(`${DO_DELETE ? "삭제 대상" : "삭제 후보"}: ${duplicateRows}건`);

  for (const group of duplicateGroups.slice(0, 20)) {
    const keep = group[0];
    console.log(`\n[keep] ${keep.company_name_raw ?? "?"} / ${keep.role} / ${keep.posted_at ?? "posted_at 없음"}`);
    for (const row of group.slice(1)) {
      console.log(`  - ${row.source} / ${row.company_name_raw ?? "?"} / ${row.role} / ${row.created_at}`);
    }
  }

  if (!DO_DELETE) {
    console.log("\nDry-run: 삭제 안 함. 실제로 지우려면 --delete.");
    return;
  }

  const idsToDelete = duplicateGroups.flatMap((group) => group.slice(1).map((row) => row.id));
  let deleted = 0;
  for (let i = 0; i < idsToDelete.length; i += 100) {
    const chunk = idsToDelete.slice(i, i + 100);
    const { error } = await admin.from("job_postings").delete().in("id", chunk);
    if (error) throw error;
    deleted += chunk.length;
  }

  console.log(`\n✅ 중복 ${deleted}건 삭제 완료. 각 중복군의 최신 1건은 유지.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
