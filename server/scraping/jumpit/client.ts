import { fetchWithRetry } from '../common/http';
import { sleep, MIN_DELAY_MS } from '../common/rate-limit';
import { filterRelevantPostings } from '../common/role-filter';
import { ScrapeError } from '../common/types';
import { SCRAPER_USER_AGENT } from '../common/user-agent';
import type { CollectedJobPosting } from '../../job-postings/types';
import {
  JUMPIT_BASE_URL,
  JUMPIT_API_BASE_URL,
  JUMPIT_POSITIONS_PATH,
  MAX_PAGES
} from './config';

type UnknownRecord = Record<string, unknown>;

interface JumpitPosition {
  id?: number | string;
  title?: string;
  companyName?: string;
  jobCategory?: string;
  techStacks?: unknown[];
  locations?: unknown[];
  dueDate?: string;
}

interface JumpitPositionsResponse {
  result?: {
    positions?: JumpitPosition[];
  };
}

function toTextList(value?: unknown[]): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim();
      }
      if (item && typeof item === 'object') {
        const record = item as UnknownRecord;
        const text = record.name ?? record.techStackName ?? record.displayName;
        return typeof text === 'string' ? text.trim() : '';
      }
      return '';
    })
    .filter((item) => item.length > 0);
}

function parseJumpitPositions(data: JumpitPositionsResponse): CollectedJobPosting[] {
  const positions = data.result?.positions;
  if (!Array.isArray(positions)) {
    throw ScrapeError.parseError('점핏 result.positions 배열을 찾을 수 없음');
  }

  return positions
    .map((item): CollectedJobPosting | null => {
      const companyName = item.companyName?.trim();
      const role = item.title?.trim();

      if (!companyName || !role) {
        return null;
      }

      const techStacks = toTextList(item.techStacks);
      const locations = toTextList(item.locations);
      const rawText = [
        item.jobCategory,
        locations.join(' / ')
      ]
        .filter(Boolean)
        .join(' / ');

      return {
        companyNameRaw: companyName,
        role,
        employmentType: '기타',
        deadline: item.dueDate,
        url: item.id ? `${JUMPIT_BASE_URL}/position/${item.id}` : undefined,
        rawText,
        techStacks: techStacks.length > 0 ? techStacks : undefined
      };
    })
    .filter((posting): posting is CollectedJobPosting => posting !== null);
}

async function fetchJumpitPage(page: number): Promise<CollectedJobPosting[]> {
  const url = new URL(JUMPIT_POSITIONS_PATH, JUMPIT_API_BASE_URL);
  url.searchParams.set('page', page.toString());
  url.searchParams.set('sort', 'relation');

  const response = await fetchWithRetry(url.toString(), {
    headers: {
      'User-Agent': SCRAPER_USER_AGENT,
      Accept: 'application/json',
      Referer: `${JUMPIT_BASE_URL}/`,
      'Accept-Language': 'ko-KR,ko;q=0.9'
    }
  });

  if (!response.ok) {
    throw ScrapeError.httpError(response.status, url.toString());
  }

  return parseJumpitPositions((await response.json()) as JumpitPositionsResponse);
}

export async function fetchJumpitListings(): Promise<CollectedJobPosting[]> {
  const allPostings: CollectedJobPosting[] = [];

  console.log('🔍 점핏 공고 검색');

  for (let page = 1; page <= MAX_PAGES; page++) {
    console.log(`    페이지 ${page}...`);
    await sleep(MIN_DELAY_MS.jumpit);

    try {
      const pagePostings = await fetchJumpitPage(page);
      if (pagePostings.length === 0) {
        console.log('    ℹ 더 이상 공고 없음');
        break;
      }

      const postings = filterRelevantPostings(pagePostings, 'jumpit');
      console.log(`    ✓ ${postings.length}건 파싱됨`);
      allPostings.push(...postings);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`    ✗ 페이지 ${page} 오류: ${msg}`);
    }
  }

  return allPostings;
}
