/**
 * 사람인 검색 결과 페이지 HTML 파싱 (cheerio).
 *
 * 사람인은 SSR이라 정적 HTML에서 공고 정보를 직접 추출할 수 있다.
 * CSS 선택자로 각 공고 항목(class="item_recruit")을 순회하며 정규화.
 */
import { load, type CheerioAPI } from 'cheerio';
import { ScrapeError } from '../common/types';
import type { CollectedJobPosting, EmploymentType } from '../../job-postings/types';
import { EMPLOYMENT_TYPES } from '../../job-postings/types';

interface RawPosting {
  companyName?: string;
  jobTitle?: string;
  employmentType?: string;
  postedDate?: string;
  deadline?: string;
  url?: string;
}

function normalizeEmploymentType(raw?: string): EmploymentType {
  if (!raw) return '기타';
  const normalized = raw.toLowerCase().trim();
  const found = EMPLOYMENT_TYPES.find((t) => normalized.includes(t) || t.includes(normalized));
  return found ?? '기타';
}

function parseItemRecruit($: CheerioAPI, $item: any): RawPosting {
  // 기본 선택자 (실제 사이트 구조에 따라 조정 필요)
  const companyName = $item.find('.company_name, .co_name, [class*="company"]').first().text().trim();
  const jobTitle = $item.find('.job_tit, .tit, h2').first().text().trim();
  const positionText = $item.find('.position, .info').text();
  const employmentType = normalizeEmploymentType(positionText);

  // 날짜 (공고 게시일/마감일) — 보통 `.date` 같은 태그에 "YYYY-MM-DD ~ YYYY-MM-DD" 형식
  const dateText = $item.find('.date, .term, [class*="date"]').text().trim();
  const [postedDateRaw, deadlineDateRaw] = dateText.split('~').map((s) => s.trim());

  // URL (공고 상세 페이지로의 링크)
  const relativeUrl = $item.find('a[href*="/jobs/relay/view"]').attr('href');
  const url = relativeUrl ? `https://www.saramin.co.kr${relativeUrl}` : undefined;

  return {
    companyName,
    jobTitle,
    employmentType,
    postedDate: postedDateRaw,
    deadline: deadlineDateRaw,
    url
  };
}

export function parseSearchResultPage(html: string): CollectedJobPosting[] {
  if (!html || html.length < 100) {
    throw ScrapeError.parseError('HTML이 너무 짧음 (페이지 로드 실패?)');
  }

  const $ = load(html);
  const postings: CollectedJobPosting[] = [];
  const items = $('[class*="item_recruit"], .item_company');

  if (items.length === 0) {
    console.warn('  ⚠ 파싱된 공고 0건 (선택자 미일치?)');
  }

  items.each((_, elem) => {
    try {
      const $item = $(elem);
      const raw = parseItemRecruit($, $item);

      // 필수 필드 검증
      if (!raw.companyName || !raw.jobTitle) {
        return; // 스킵
      }

      const posting: CollectedJobPosting = {
        companyNameRaw: raw.companyName,
        role: raw.jobTitle,
        employmentType: raw.employmentType ?? '기타',
        postedAt: raw.postedDate,
        deadline: raw.deadline,
        url: raw.url
      };

      postings.push(posting);
    } catch (err) {
      console.warn(`  ⚠ 항목 파싱 실패: ${err instanceof Error ? err.message : String(err)}`);
      // 개별 항목 실패는 계속 진행
    }
  });

  if (postings.length === 0) {
    throw ScrapeError.parseError(`HTML에서 유효한 공고 0건 파싱됨 (검색어 결과 0? 사이트 구조 변경?)`);
  }

  return postings;
}
