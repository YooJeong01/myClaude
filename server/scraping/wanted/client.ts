import { fetchWithRetry } from '../common/http';
import { sleep, withJitter, MIN_DELAY_MS } from '../common/rate-limit';
import { filterRelevantPostings } from '../common/role-filter';
import { ScrapeError } from '../common/types';
import { SCRAPER_USER_AGENT } from '../common/user-agent';
import type { CollectedJobPosting } from '../../job-postings/types';
import {
  WANTED_BASE_URL,
  WANTED_RESULTS_PATH,
  WANTED_JOB_GROUP_ID,
  WANTED_PAGE_SIZE,
  MAX_PAGES
} from './config';

interface WantedCompany {
  name?: string;
}

interface WantedAddress {
  location?: string;
  district?: string;
}

interface WantedListingItem {
  id?: number | string;
  company?: WantedCompany;
  position?: string;
  address?: WantedAddress;
}

interface WantedResultsResponse {
  data?: WantedListingItem[];
}

function parseWantedResults(data: WantedResultsResponse): CollectedJobPosting[] {
  if (!Array.isArray(data.data)) {
    throw ScrapeError.parseError('원티드 data 배열을 찾을 수 없음');
  }

  return data.data
    .map((item): CollectedJobPosting | null => {
      const companyName = item.company?.name?.trim();
      const role = item.position?.trim();

      if (!companyName || !role) {
        return null;
      }

      const location = [
        item.address?.location,
        item.address?.district
      ]
        .filter(Boolean)
        .join(' ');

      return {
        companyNameRaw: companyName,
        role,
        employmentType: '기타',
        deadline: undefined,
        url: item.id ? `${WANTED_BASE_URL}/wd/${item.id}` : undefined,
        rawText: location
      };
    })
    .filter((posting): posting is CollectedJobPosting => posting !== null);
}

async function fetchWantedPage(page: number): Promise<CollectedJobPosting[]> {
  const offset = page * WANTED_PAGE_SIZE;
  const url = new URL(WANTED_RESULTS_PATH, WANTED_BASE_URL);
  url.searchParams.set('job_group_id', WANTED_JOB_GROUP_ID);
  url.searchParams.set('job_sort', 'job.latest_order');
  url.searchParams.set('years', '-1');
  url.searchParams.set('locations', 'all');
  url.searchParams.set('limit', WANTED_PAGE_SIZE.toString());
  url.searchParams.set('offset', offset.toString());

  const response = await fetchWithRetry(url.toString(), {
    headers: {
      'User-Agent': SCRAPER_USER_AGENT,
      Accept: 'application/json',
      Referer: `${WANTED_BASE_URL}/wdlist/${WANTED_JOB_GROUP_ID}`,
      'Accept-Language': 'ko-KR,ko;q=0.9'
    }
  });

  if (!response.ok) {
    throw ScrapeError.httpError(response.status, url.toString());
  }

  return parseWantedResults((await response.json()) as WantedResultsResponse);
}

export async function fetchWantedListings(): Promise<CollectedJobPosting[]> {
  const allPostings: CollectedJobPosting[] = [];

  console.log('🔍 원티드 개발 직군 검색');

  for (let page = 0; page < MAX_PAGES; page++) {
    console.log(`    페이지 ${page + 1}...`);
    await sleep(withJitter(MIN_DELAY_MS.wanted));

    try {
      const pagePostings = await fetchWantedPage(page);
      if (pagePostings.length === 0) {
        console.log('    ℹ 더 이상 공고 없음');
        break;
      }

      const postings = filterRelevantPostings(pagePostings, 'wanted');
      console.log(`    ✓ ${postings.length}건 파싱됨`);
      allPostings.push(...postings);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`    ✗ 페이지 ${page + 1} 오류: ${msg}`);
    }
  }

  return allPostings;
}
