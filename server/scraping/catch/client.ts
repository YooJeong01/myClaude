/**
 * 캐치 스크래핑 클라이언트 (Playwright, Nuxt).
 *
 * Nuxt 기반이라 메타태그는 SSR이지만 실제 리스트는 CSR.
 * 브라우저로 렌더링 후 콘텐츠 추출.
 */
import { load } from 'cheerio';
import type { Page } from 'playwright';
import { launchBrowser, withPage } from '../common/browser';
import { sleep } from '../common/rate-limit';
import { MIN_DELAY_MS } from '../common/rate-limit';
import { ScrapeError } from '../common/types';
import type { CollectedJobPosting, EmploymentType } from '../../job-postings/types';
import { EMPLOYMENT_TYPES } from '../../job-postings/types';
import {
  CATCH_BASE_URL,
  CATCH_SEARCH_PATH,
  SEARCH_KEYWORDS,
  MAX_PAGES_PER_KEYWORD,
  NAVIGATION_TIMEOUT_MS,
  CONTENT_LOAD_TIMEOUT_MS
} from './config';

function normalizeEmploymentType(raw?: string): EmploymentType {
  if (!raw) return '기타';
  const normalized = raw.toLowerCase().trim();
  const found = EMPLOYMENT_TYPES.find((t) => normalized.includes(t) || t.includes(normalized));
  return found ?? '기타';
}

async function parseCatchPage(page: Page): Promise<CollectedJobPosting[]> {
  const postings: CollectedJobPosting[] = [];

  try {
    // 캐치 공고 리스트 컨테이너 선택자 (사이트 구조에 따라 조정 필요)
    await page.waitForSelector('[class*="recruit"], [class*="list"], ul, table', {
      timeout: CONTENT_LOAD_TIMEOUT_MS
    });

    const html = await page.content();
    const $ = load(html);

    // 공고 항목 순회
    const items = $('[class*="item"], [class*="row"], tr[class*="recruit"], li[class*="recruit"]');

    items.each((_, elem) => {
      try {
        const $item = $(elem);

        const companyName = $item
          .find('[class*="company"], .co_name')
          .first()
          .text()
          .trim();
        const jobTitle = $item
          .find('[class*="tit"], .job_title, h3, h4')
          .first()
          .text()
          .trim();
        const positionText = $item.find('[class*="position"], .type, .info').text();
        const employmentType = normalizeEmploymentType(positionText);

        // URL (공고 상세 페이지 링크)
        const href = $item.find('a[href*="/Comp/RecruitInfo/"]').attr('href');
        const url = href
          ? href.startsWith('http')
            ? href
            : `${CATCH_BASE_URL}${href}`
          : undefined;

        if (!companyName || !jobTitle) {
          return;
        }

        const posting: CollectedJobPosting = {
          companyNameRaw: companyName,
          role: jobTitle,
          employmentType,
          url
        };

        postings.push(posting);
      } catch (err) {
        console.warn(`    ⚠ 항목 파싱 실패: ${err instanceof Error ? err.message : String(err)}`);
      }
    });

    return postings;
  } catch (err) {
    if (err instanceof Error && err.message.includes('Timeout')) {
      throw ScrapeError.timeout(`${CATCH_BASE_URL}${CATCH_SEARCH_PATH}`);
    }
    throw ScrapeError.parseError(err instanceof Error ? err.message : String(err));
  }
}

export async function fetchCatchListings(): Promise<CollectedJobPosting[]> {
  const allPostings: CollectedJobPosting[] = [];

  if (SEARCH_KEYWORDS.length === 0) {
    console.log('  ℹ️ SCRAPE_SEARCH_KEYWORDS 미설정, 키워드 없음');
    return allPostings;
  }

  console.log(`🔍 캐치 검색: ${SEARCH_KEYWORDS.join(', ')}`);

  const browser = await launchBrowser();

  try {
    for (const keyword of SEARCH_KEYWORDS) {
      console.log(`\n  📌 키워드: "${keyword}"`);

      for (let page = 1; page <= MAX_PAGES_PER_KEYWORD; page++) {
        console.log(`    페이지 ${page}...`);
        await sleep(MIN_DELAY_MS.catch);

        try {
          const postings = await withPage(browser, async (pageObj) => {
            const url = new URL(CATCH_SEARCH_PATH, CATCH_BASE_URL);
            url.searchParams.set('Search_Type', 'TotalKeyword');
            url.searchParams.set('Search_Word', keyword);
            url.searchParams.set('Page', page.toString());

            await pageObj.goto(url.toString(), {
              waitUntil: 'networkidle',
              timeout: NAVIGATION_TIMEOUT_MS
            });

            return await parseCatchPage(pageObj);
          });

          console.log(`    ✓ ${postings.length}건 파싱됨`);
          allPostings.push(...postings);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`    ✗ 페이지 ${page} 오류: ${msg}`);
        }
      }
    }
  } finally {
    await browser.close();
  }

  return allPostings;
}
