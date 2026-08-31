/**
 * DART 고유번호(corpCode.xml) 전체를 내려받아 dart_corp_codes 테이블에 적재한다.
 *
 * 지금은 수동 실행. 2일차에 GitHub Actions cron 으로 옮긴다.
 *
 * 실행:
 *   NODE_OPTIONS=--experimental-websocket \
 *   pnpm exec tsx --env-file=.env.local server/jobs/sync-dart-corp-codes.ts
 */
import { downloadCorpCodeEntries } from "../dart/corp-code-file";
import { createAdminClient } from "../supabase/admin";

const BATCH_SIZE = 1000;

async function main(): Promise<void> {
  console.log("1. corpCode.xml 다운로드 + 파싱");
  const entries = await downloadCorpCodeEntries();
  console.log(`  ✓ ${entries.length.toLocaleString()} 개 기업`);

  const rows = entries.map((e) => ({
    corp_code: e.corpCode,
    corp_name: e.corpName,
    corp_eng_name: e.corpEngName,
    stock_code: e.stockCode,
    modify_date: e.modifyDate
  }));

  console.log(`2. dart_corp_codes upsert (${BATCH_SIZE}행씩)`);
  const admin = createAdminClient();
  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await admin
      .from("dart_corp_codes")
      .upsert(batch, { onConflict: "corp_code" });
    if (error) {
      throw new Error(`배치 ${i}~${i + batch.length}: ${error.message}`);
    }
    done += batch.length;
    if (done % (BATCH_SIZE * 10) === 0 || done === rows.length) {
      console.log(`  ✓ ${done.toLocaleString()} / ${rows.length.toLocaleString()}`);
    }
  }

  const { count } = await admin
    .from("dart_corp_codes")
    .select("corp_code", { count: "exact", head: true });
  console.log(`\n✅ 완료. 테이블 행 수: ${count?.toLocaleString() ?? "?"}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
