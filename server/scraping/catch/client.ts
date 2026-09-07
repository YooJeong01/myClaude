import { fetchWithRetry } from '../common/http';
import { sleep } from '../common/rate-limit';
import { MIN_DELAY_MS } from '../common/rate-limit';
import { ScrapeError } from '../common/types';
import { SCRAPER_USER_AGENT } from '../common/user-agent';
import type { CollectedJobPosting, EmploymentType } from '../../job-postings/types';
import { EMPLOYMENT_TYPES } from '../../job-postings/types';
import {
  CATCH_BASE_URL,
  CATCH_SEARCH_PATH,
  SEARCH_KEYWORDS,
  MAX_PAGES_PER_KEYWORD
} from './config';

function normalizeEmploymentType(raw?: string): EmploymentType {
  if (!raw) return '기타';
  const normalized = raw.toLowerCase().trim();
  const found = EMPLOYMENT_TYPES.find((t) => normalized.includes(t) || t.includes(normalized));
  return found ?? '기타';
}

interface CatchRecruitItem {
  RecruitID?: number;
  RecruitTitle?: string;
  CompName?: string;
  GubunCode?: string;
  ApplyStartDatetime?: string;
  ApplyEndDatetime?: string;
  Depth?: string;
  CareerGubunCode?: string;
  ExperienceText?: string | null;
  ExperienceRange?: string | null;
  WorkArea?: string;
}

interface CatchRecruitResponse {
  recruitData?: CatchRecruitItem[];
}

function parseCatchRecruitResponse(data: CatchRecruitResponse): CollectedJobPosting[] {
  if (!Array.isArray(data.recruitData)) {
    throw ScrapeError.parseError('캐치 recruitData 배열을 찾을 수 없음');
  }

  return data.recruitData
    .map((item): CollectedJobPosting | null => {
      const companyName = item.CompName?.trim();
      const jobTitle = item.RecruitTitle?.trim();

      if (!companyName || !jobTitle) {
        return null;
      }

      const rawText = [
        item.Depth,
        item.CareerGubunCode,
        item.ExperienceText,
        item.ExperienceRange,
        item.WorkArea
      ]
        .filter(Boolean)
        .join(' / ');

      return {
        companyNameRaw: companyName,
        role: jobTitle,
        employmentType: normalizeEmploymentType(item.GubunCode),
        postedAt: item.ApplyStartDatetime,
        deadline: item.ApplyEndDatetime,
        url: item.RecruitID ? `${CATCH_BASE_URL}/NCS/RecruitInfoDetails/${item.RecruitID}` : undefined,
        rawText
      };
    })
    .filter((posting): posting is CollectedJobPosting => posting !== null);
}

async function fetchCatchPage(keyword: string, page: number): Promise<CollectedJobPosting[]> {
  const url = new URL('/api/v1.0/recruit/information/getRecruitList', CATCH_BASE_URL);
  url.searchParams.set('Keyword', keyword);
  url.searchParams.set('JobCode', '');
  url.searchParams.set('Sido', '');
  url.searchParams.set('Career', '');
  url.searchParams.set('JCode', '');
  url.searchParams.set('Size', '');
  url.searchParams.set('EduLevel', '');
  url.searchParams.set('WorkPosition', '');
  url.searchParams.set('CompID', '');
  url.searchParams.set('GroupCode', '');
  url.searchParams.set('Sort', '0');
  url.searchParams.set('curpage', page.toString());
  url.searchParams.set('pageSize', '30');
  url.searchParams.set('onRecruitYN', 'Y');
  url.searchParams.set('ExceptIDList', '');

  const response = await fetchWithRetry(url.toString(), {
    headers: {
      'User-Agent': SCRAPER_USER_AGENT,
      Accept: 'application/json',
      Referer: `${CATCH_BASE_URL}${CATCH_SEARCH_PATH}`,
      'Accept-Language': 'ko-KR,ko;q=0.9'
    }
  });

  if (!response.ok) {
    throw ScrapeError.httpError(response.status, url.toString());
  }

  return parseCatchRecruitResponse((await response.json()) as CatchRecruitResponse);
}

export async function fetchCatchListings(): Promise<CollectedJobPosting[]> {
  const allPostings: CollectedJobPosting[] = [];

  if (SEARCH_KEYWORDS.length === 0) {
    console.log('  ⚠️ SCRAPE_SEARCH_KEYWORDS 미설정: 키워드가 없음');
    return allPostings;
  }

  console.log(`🔍 캐치 검색: ${SEARCH_KEYWORDS.join(', ')}`);

  for (const keyword of SEARCH_KEYWORDS) {
    console.log(`\n  📌 키워드: "${keyword}"`);

    for (let page = 1; page <= MAX_PAGES_PER_KEYWORD; page++) {
      console.log(`    페이지 ${page}...`);
      await sleep(MIN_DELAY_MS.catch);

      try {
        const postings = await fetchCatchPage(keyword, page);
        console.log(`    ✓ ${postings.length}건 파싱됨`);
        allPostings.push(...postings);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`    ❌ 페이지 ${page} 오류: ${msg}`);
      }
    }
  }

  return allPostings;
}
