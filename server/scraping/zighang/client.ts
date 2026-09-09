import { fetchWithRetry } from '../common/http';
import { sleep, withJitter, MIN_DELAY_MS } from '../common/rate-limit';
import { filterRelevantPostings } from '../common/role-filter';
import { ScrapeError } from '../common/types';
import { SCRAPER_USER_AGENT } from '../common/user-agent';
import type { CollectedJobPosting, EmploymentType } from '../../job-postings/types';
import { EMPLOYMENT_TYPES } from '../../job-postings/types';
import {
  ZIGHANG_BASE_URL,
  ZIGHANG_API_BASE_URL,
  ZIGHANG_RECRUITMENTS_PATH,
  ZIGHANG_PAGE_SIZE,
  MAX_PAGES
} from './config';

interface ZighangCompany {
  name?: string;
}

interface ZighangRecruitment {
  id?: string;
  affiliate?: string;
  company?: ZighangCompany;
  title?: string;
  createdAt?: string;
  endDate?: string;
  deadlineType?: string;
  regions?: string[];
  employeeTypes?: string[];
  depthOnes?: string[];
  depthTwos?: string[];
  depthThrees?: string[];
  keywords?: string[];
}

interface ZighangRecruitmentsResponse {
  success?: boolean;
  data?: {
    content?: ZighangRecruitment[];
    last?: boolean;
  };
  message?: string | null;
}

function normalizeEmploymentType(raw?: string): EmploymentType {
  if (!raw) return '기타';
  const normalized = raw.trim();
  return EMPLOYMENT_TYPES.find((type) => normalized.includes(type) || type.includes(normalized)) ?? '기타';
}

function parseZighangRecruitments(data: ZighangRecruitmentsResponse): {
  postings: CollectedJobPosting[];
  last: boolean;
} {
  if (data.success === false) {
    throw ScrapeError.parseError(data.message ?? '지행 API success=false');
  }

  const content = data.data?.content;
  if (!Array.isArray(content)) {
    throw ScrapeError.parseError('지행 data.content 배열을 찾을 수 없음');
  }

  const postings = content
    .map((item): CollectedJobPosting | null => {
      const companyName = item.company?.name?.trim();
      const role = item.title?.trim();

      if (!companyName || !role) {
        return null;
      }

      const rawText = [
        item.affiliate,
        item.deadlineType,
        ...(item.depthOnes ?? []),
        ...(item.depthTwos ?? []),
        ...(item.depthThrees ?? []),
        ...(item.regions ?? []),
        ...(item.keywords ?? [])
      ]
        .filter(Boolean)
        .join(' / ');

      return {
        companyNameRaw: companyName,
        role,
        employmentType: normalizeEmploymentType(item.employeeTypes?.[0]),
        postedAt: item.createdAt,
        deadline: item.endDate,
        url: item.id ? `${ZIGHANG_BASE_URL}/recruitment/${item.id}` : undefined,
        rawText
      };
    })
    .filter((posting): posting is CollectedJobPosting => posting !== null);

  return {
    postings,
    last: data.data?.last === true
  };
}

async function fetchZighangPage(page: number): Promise<{
  postings: CollectedJobPosting[];
  last: boolean;
}> {
  const url = new URL(ZIGHANG_RECRUITMENTS_PATH, ZIGHANG_API_BASE_URL);
  url.searchParams.set('page', page.toString());
  url.searchParams.set('size', ZIGHANG_PAGE_SIZE.toString());
  url.searchParams.set('sortCondition', 'LATEST');
  url.searchParams.set('orderCondition', 'DESC');
  url.searchParams.append('depthOnes', 'IT_개발');

  const response = await fetchWithRetry(url.toString(), {
    headers: {
      'User-Agent': SCRAPER_USER_AGENT,
      Accept: 'application/json',
      Referer: `${ZIGHANG_BASE_URL}/recruitment`,
      'Accept-Language': 'ko-KR,ko;q=0.9'
    }
  });

  if (!response.ok) {
    throw ScrapeError.httpError(response.status, url.toString());
  }

  return parseZighangRecruitments((await response.json()) as ZighangRecruitmentsResponse);
}

export async function fetchZighangListings(): Promise<CollectedJobPosting[]> {
  const allPostings: CollectedJobPosting[] = [];

  console.log('🔍 지행 IT·개발 공고 검색');

  for (let page = 0; page < MAX_PAGES; page++) {
    console.log(`    페이지 ${page + 1}...`);
    await sleep(withJitter(MIN_DELAY_MS.zighang));

    try {
      const result = await fetchZighangPage(page);
      if (result.postings.length === 0) {
        console.log('    ℹ 더 이상 공고 없음');
        break;
      }

      const postings = filterRelevantPostings(result.postings, 'zighang');
      console.log(`    ✓ ${postings.length}건 파싱됨`);
      allPostings.push(...postings);

      if (result.last) {
        break;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`    ✗ 페이지 ${page + 1} 오류: ${msg}`);
    }
  }

  return allPostings;
}
