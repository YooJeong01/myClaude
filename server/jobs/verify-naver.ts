/**
 * 네이버 뉴스 검색 API 테스트.
 *
 * 실제 API 호출이 작동하는지 확인한다.
 *
 * 실행:
 *   pnpm exec tsx --env-file=.env.local server/jobs/verify-naver.ts
 */
import { fetchCompanyNews } from '../naver/client';

async function main(): Promise<void> {
  console.log('🚀 네이버 뉴스 검색 API 테스트\n');

  // 테스트 회사명 (유명한 기업으로 결과가 나올 확률 높음)
  const testCompanyNames = ['삼성전자', '현대자동차', 'NAVER'];

  for (const companyName of testCompanyNames) {
    console.log(`📰 "${companyName}" 검색...`);

    try {
      const news = await fetchCompanyNews(companyName, 5);
      console.log(`  ✓ ${news.length}건 조회됨`);

      if (news.length > 0) {
        console.log(`  예시: ${news[0].title.substring(0, 50)}...`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ 오류: ${msg}`);
    }

    console.log();
  }

  console.log('✅ 테스트 완료');
}

main().catch((error) => {
  console.error('❌ 오류:', error.message);
  process.exit(1);
});
