/**
 * 한경컨센서스 리포트 목록 스크래핑 테스트.
 *
 * 실제 HTML 목록 조회가 작동하는지 확인한다. .env.local은 필요하지 않다.
 *
 * 실행:
 *   pnpm exec tsx server/jobs/verify-hankyung.ts
 */
import { fetchRecentReports } from '../hankyung/client';

async function main(): Promise<void> {
  console.log('🚀 한경컨센서스 리포트 목록 테스트\n');

  const reports = await fetchRecentReports({
    stockName: '삼성전자',
    limit: 3
  });

  console.log(`📄 ${reports.length}건 조회됨`);

  for (const report of reports) {
    console.log(
      [
        `- ${report.publishedDate}`,
        report.stockCode ? `${report.stockName}(${report.stockCode})` : report.stockName,
        report.title,
        report.securitiesFirm,
        report.originalUrl
      ]
        .filter(Boolean)
        .join(' | ')
    );
  }

  console.log('\n✅ 테스트 완료');
}

main().catch((error) => {
  console.error('❌ 오류:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
