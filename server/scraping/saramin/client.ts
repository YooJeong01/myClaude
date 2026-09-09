/**
 * 사람인 스크래핑 클라이언트.
 *
 * 설정된 키워드들을 순회하며 검색 결과 페이지를 가져오고,
 * 각 페이지에서 공고들을 추출한다.
 */
import { fetchWithRetry } from '../common/http';
import { sleep, withJitter } from '../common/rate-limit';
import { MIN_DELAY_MS } from '../common/rate-limit';
import { filterRelevantPostings } from '../common/role-filter';
import { SCRAPER_USER_AGENT } from '../common/user-agent';
import { parseSearchResultPage } from './parser';
import { SARAMIN_BASE_URL, SARAMIN_SEARCH_ENDPOINT, SEARCH_KEYWORDS, MAX_PAGES_PER_KEYWORD } from './config';
import type { CollectedJobPosting } from '../../job-postings/types';

export async function fetchSaraminListings(): Promise<CollectedJobPosting[]> {
  const allPostings: CollectedJobPosting[] = [];

  if (SEARCH_KEYWORDS.length === 0) {
    console.log('  ℹ️ SCRAPE_SEARCH_KEYWORDS 미설정, 키워드 없음');
    return allPostings;
  }

  console.log(`🔍 사람인 검색: ${SEARCH_KEYWORDS.join(', ')}`);

  for (const keyword of SEARCH_KEYWORDS) {
    console.log(`\n  📌 키워드: "${keyword}"`);

    for (let page = 1; page <= MAX_PAGES_PER_KEYWORD; page++) {
      try {
        const url = new URL(SARAMIN_SEARCH_ENDPOINT, SARAMIN_BASE_URL);
        // 사람인 검색 파라미터는 `searchword`. (기존 `searchKeyword` 는 무시돼
        // 키워드 없는 전체 목록이 나왔고, 그래서 무관 공고가 대량 유입됐다.)
        url.searchParams.set('searchword', keyword);
        url.searchParams.set('recruitPage', page.toString());

        console.log(`    페이지 ${page}...`);
        await sleep(withJitter(MIN_DELAY_MS.saramin));

        const response = await fetchWithRetry(url.toString(), {
          headers: {
            'User-Agent': SCRAPER_USER_AGENT,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9'
          }
        });

        if (!response.ok) {
          console.warn(`    ⚠ HTTP ${response.status}, 이 페이지 스킵`);
          continue;
        }

        const html = await response.text();
        const postings = filterRelevantPostings(
          parseSearchResultPage(html),
          'saramin'
        );

        console.log(`    ✓ ${postings.length}건 파싱됨`);
        allPostings.push(...postings);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`    ✗ 페이지 ${page} 오류: ${msg}`);
        // 페이지 실패는 계속 진행 (다음 페이지/키워드로)
      }
    }
  }

  return allPostings;
}
