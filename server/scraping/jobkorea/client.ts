/**
 * 잡코리아 스크래핑 클라이언트 (Playwright).
 *
 * CSR 페이지이므로 헤드리스 브라우저로 렌더링 후 콘텐츠를 추출한다.
 * Cheerio로 HTML 파싱하거나, 브라우저 자체 querySelectors를 사용.
 */
import { load } from 'cheerio';
import type { Page } from 'playwright';
import { launchBrowser, withPage } from '../common/browser';
import { sleep } from '../common/rate-limit';
import { MIN_DELAY_MS } from '../common/rate-limit';
import { filterRelevantPostings } from '../common/role-filter';
import { ScrapeError } from '../common/types';
import type { CollectedJobPosting, EmploymentType } from '../../job-postings/types';
import { EMPLOYMENT_TYPES } from '../../job-postings/types';
import {
  JOBKOREA_BASE_URL,
  JOBKOREA_SEARCH_PATH,
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

async function parseJobkoreaPage(page: Page): Promise<CollectedJobPosting[]> {
  const postings: CollectedJobPosting[] = [];

  try {
    // 페이지 렌더링 대기 (Next.js 번들 로드, 콘텐츠 렌더링)
    // 채용 리스트 컨테이너 선택자 (사이트 구조에 따라 조정 필요)
    await page.waitForSelector('[class*="recruit"], [class*="job"], article, li[class*="item"]', {
      timeout: CONTENT_LOAD_TIMEOUT_MS
    });

    const html = await page.content();
    const $ = load(html);

    // 공고 항목 순회 (일반적인 구조)
    const items = $('[class*="item_company"], [class*="recruit"], article, li[class*="job"]');

    items.each((_, elem) => {
      try {
        const $item = $(elem);

        // 회사명, 직무, 정보 추출
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
        const positionText = $item.find('[class*="position"], .info, .type').text();
        const employmentType = normalizeEmploymentType(positionText);

        // URL (공고 상세 페이지)
        const href = $item.find('a').attr('href');
        const url = href
          ? href.startsWith('http')
            ? href
            : `${JOBKOREA_BASE_URL}${href}`
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
      throw ScrapeError.timeout(`${JOBKOREA_BASE_URL}${JOBKOREA_SEARCH_PATH}`);
    }
    throw ScrapeError.parseError(err instanceof Error ? err.message : String(err));
  }
}

export async function fetchJobkoreaListings(): Promise<CollectedJobPosting[]> {
  const allPostings: CollectedJobPosting[] = [];

  if (SEARCH_KEYWORDS.length === 0) {
    console.log('  ℹ️ SCRAPE_SEARCH_KEYWORDS 미설정, 키워드 없음');
    return allPostings;
  }

  console.log(`🔍 잡코리아 검색: ${SEARCH_KEYWORDS.join(', ')}`);

  const browser = await launchBrowser();

  try {
    for (const keyword of SEARCH_KEYWORDS) {
      console.log(`\n  📌 키워드: "${keyword}"`);

      for (let page = 1; page <= MAX_PAGES_PER_KEYWORD; page++) {
        console.log(`    페이지 ${page}...`);
        await sleep(MIN_DELAY_MS.jobkorea);

        try {
          const postings = await withPage(browser, async (pageObj) => {
            const url = new URL(JOBKOREA_SEARCH_PATH, JOBKOREA_BASE_URL);
            url.searchParams.set('stext', keyword);
            url.searchParams.set('Page_No', page.toString());

            await pageObj.goto(url.toString(), {
              waitUntil: 'networkidle',
              timeout: NAVIGATION_TIMEOUT_MS
            });

            return await parseJobkoreaPage(pageObj);
          });

          const relevantPostings = filterRelevantPostings(postings, 'jobkorea');
          console.log(`    ✓ ${relevantPostings.length}건 파싱됨`);
          allPostings.push(...relevantPostings);
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
