/**
 * 사람인 검색 결과 페이지 HTML 파싱 (cheerio).
 *
 * 사람인은 SSR이라 정적 HTML에서 공고 정보를 직접 추출할 수 있다.
 * CSS 선택자로 각 공고 항목(class="item_recruit")을 순회하며 정규화.
 */
import { load, type CheerioAPI, type Cheerio } from 'cheerio';
import { ScrapeError } from '../common/types';
import type { CollectedJobPosting, EmploymentType } from '../../job-postings/types';
import { EMPLOYMENT_TYPES } from '../../job-postings/types';

// cheerio v1.x 는 노드 타입(Element)을 re-export 하지 않으므로 $() 반환 타입에서 추론한다.
type CheerioNode = ReturnType<CheerioAPI> extends Cheerio<infer T> ? T : never;

interface RawPosting {
  companyName?: string;
  jobTitle?: string;
  employmentType: EmploymentType;
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

/** ".job_day" 텍스트("등록일 26/09/07" / "수정일 26/09/07")에서 게시일을 YYYY-MM-DD 로. */
function parsePostedDate(jobDayText: string): string | undefined {
  const m = jobDayText.match(/(\d{2})\/(\d{2})\/(\d{2})/);
  if (!m) return undefined;
  return `20${m[1]}-${m[2]}-${m[3]}`;
}

/**
 * ".date" 텍스트에서 마감일을 YYYY-MM-DD 로.
 * 형식: "~ 10/07(수)" (연도 없음) / "채용시" / "오늘마감" / "상시채용" 등.
 * 연도는 게시일 기준으로 추정한다(마감일 >= 게시일).
 */
function parseDeadline(dateText: string, postedDate?: string): string | undefined {
  const m = dateText.match(/(\d{1,2})\/(\d{1,2})/);
  if (!m) return undefined; // "채용시", "오늘마감", "상시채용" 등 → 마감일 없음
  const mm = m[1].padStart(2, '0');
  const dd = m[2].padStart(2, '0');
  const base = postedDate ? new Date(postedDate) : new Date();
  let year = base.getFullYear();
  // 마감 MM-DD 가 게시 월-일보다 앞서면 다음 해로 넘어간 공고
  const posted = `${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`;
  if (`${mm}-${dd}` < posted) year += 1;
  return `${year}-${mm}-${dd}`;
}

function parseItemRecruit($: CheerioAPI, $item: Cheerio<CheerioNode>): RawPosting {
  // 회사명: .corp_name (검색결과 각 항목의 회사명 링크)
  const companyName = $item.find('.corp_name').first().text().replace(/\s+/g, ' ').trim();
  // 직무: h2.job_tit 안의 앵커 텍스트
  const jobTitle = $item.find('.job_tit').first().text().replace(/\s+/g, ' ').trim();
  // 고용형태: .job_condition ("부산 해운대구 경력무관 대졸↑ 정규직")
  const conditionText = $item.find('.job_condition').text();
  const employmentType = normalizeEmploymentType(conditionText);

  // 게시일: .job_day ("등록일/수정일 YY/MM/DD"), 마감일: .job_date .date ("~ MM/DD(요일)")
  const postedDate = parsePostedDate($item.find('.job_day').text().trim());
  const deadline = parseDeadline($item.find('.job_date .date, .date').first().text().trim(), postedDate);

  // URL (공고 상세 페이지)
  const relativeUrl = $item.find('.job_tit a[href*="rec_idx"], a[href*="/jobs/relay/view"]').first().attr('href');
  const url = relativeUrl
    ? `https://www.saramin.co.kr${relativeUrl.replace(/&amp;/g, '&')}`
    : undefined;

  return {
    companyName,
    jobTitle,
    employmentType,
    postedDate,
    deadline,
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
        employmentType: raw.employmentType,
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
