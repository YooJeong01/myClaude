/**
 * 사람인 채용공고 스크래핑 잡.
 *
 * 설정된 검색 키워드로 사람인을 검색하고, 결과를 Supabase에 저장한다.
 * GitHub Actions 스케줄 또는 로컬 테스트용으로 실행.
 *
 * 실행:
 *   pnpm exec tsx --env-file=.env.local server/jobs/scrape-saramin.ts
 */
import { createAdminClient } from '../supabase/admin';
import { fetchSaraminListings } from '../scraping/saramin/client';
import { insertCollectedJobPostings } from '../job-postings/persist';

async function main(): Promise<void> {
  const userId = process.env.SCRAPE_OWNER_USER_ID;
  if (!userId) {
    throw new Error('❌ SCRAPE_OWNER_USER_ID 환경변수를 설정하세요.');
  }

  console.log('🚀 사람인 스크래핑 시작\n');

  console.log('1️⃣  Supabase 연결');
  const admin = createAdminClient();
  console.log('  ✓ 연결됨\n');

  console.log('2️⃣  공고 검색');
  const postings = await fetchSaraminListings();
  console.log(`  총 ${postings.length}건 수집됨\n`);

  if (postings.length === 0) {
    console.log('⚠️  검색된 공고가 없음. 종료.');
    return;
  }

  console.log('3️⃣  DB에 저장');
  const { inserted, skipped } = await insertCollectedJobPostings(admin, userId, postings, 'scrape_saramin');

  console.log(`\n✅ 완료`);
  console.log(`  삽입: ${inserted}건`);
  console.log(`  중복 스킵: ${skipped}건`);
}

main().catch((error) => {
  console.error('❌ 오류:', error.message);
  process.exit(1);
});
