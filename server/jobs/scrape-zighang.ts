/**
 * 지행 채용공고 스크래핑 잡.
 *
 * 실행:
 *   pnpm exec tsx --env-file=.env.local server/jobs/scrape-zighang.ts
 */
import { createAdminClient } from '../supabase/admin';
import { fetchZighangListings } from '../scraping/zighang/client';
import { insertCollectedJobPostings } from '../job-postings/persist';

async function main(): Promise<void> {
  const userId = process.env.SCRAPE_OWNER_USER_ID;
  if (!userId) {
    throw new Error('❌ SCRAPE_OWNER_USER_ID 환경변수를 설정하세요.');
  }

  console.log('🚀 지행 스크래핑 시작\n');

  console.log('1️⃣  Supabase 연결');
  const admin = createAdminClient();
  console.log('  ✓ 연결됨\n');

  console.log('2️⃣  공고 검색');
  const postings = await fetchZighangListings();
  console.log(`  총 ${postings.length}건 수집됨\n`);

  if (postings.length === 0) {
    console.log('⚠️  검색된 공고가 없음. 종료.');
    return;
  }

  console.log('3️⃣  DB에 저장');
  const { inserted, skipped } = await insertCollectedJobPostings(admin, userId, postings, 'scrape_zighang');

  console.log(`\n✅ 완료`);
  console.log(`  삽입: ${inserted}건`);
  console.log(`  중복 스킵: ${skipped}건`);
}

main().catch((error) => {
  console.error('❌ 오류:', error.message);
  process.exit(1);
});
