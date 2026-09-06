/**
 * 사람인/잡코리아 채용 알림 이메일 파싱.
 *
 * 각 사이트는 고유한 이메일 템플릿을 사용하므로, 사이트별로 파서를 구현한다.
 * cheerio를 사용해 HTML 본문에서 공고 정보를 추출.
 *
 * ⚠️ 참고:
 * - 실제 이메일 템플릿은 사이트가 변경할 수 있으므로, 정기적 점검 필요.
 * - 공고 링크 추출이 핵심 (본문 텍스트는 선택).
 * - 파싱 실패 시 로그하고 계속 진행 (건너뛰기).
 */
import { load } from 'cheerio';
import type { CollectedJobPosting, EmploymentType } from '../job-postings/types';
import { EMPLOYMENT_TYPES } from '../job-postings/types';

export function normalizeEmploymentType(raw?: string): EmploymentType {
  if (!raw) return '기타';
  const normalized = raw.toLowerCase().trim();
  const found = EMPLOYMENT_TYPES.find((t) => normalized.includes(t) || t.includes(normalized));
  return found ?? '기타';
}

/**
 * 사람인 알림 이메일 파싱.
 *
 * 사람인 이메일은 보통:
 * - 제목: "사람인 추천 공고: [회사명] [직무]"
 * - 본문: 공고 링크 (https://www.saramin.co.kr/zf_user/jobs/relay/view?...)
 */
export function parseSaraminAlertEmail(html: string): CollectedJobPosting[] {
  const postings: CollectedJobPosting[] = [];
  if (!html) return postings;

  try {
    const $ = load(html);

    // 공고 링크 찾기 (일반적인 <a> 태그)
    const links = $('a[href*="saramin.co.kr"][href*="jobs"]');

    links.each((_, elem) => {
      try {
        const href = $(elem).attr('href');
        const text = $(elem).text().trim();

        if (!href || !text) return;

        // URL에서 회사명/직무 추출 (쿼리파라미터 또는 텍스트 사용)
        // 간단한 방법: 링크 텍스트에서 "회사명 직무" 형식 추정
        const parts = text.split(/[\s-]+/).filter((p) => p.length > 0);
        if (parts.length < 2) return;

        const posting: CollectedJobPosting = {
          companyNameRaw: parts[0],
          role: parts.slice(1).join(' '),
          employmentType: '기타',
          url: href
        };

        postings.push(posting);
      } catch (err) {
        console.warn(`  ⚠ 사람인 링크 파싱 실패: ${err instanceof Error ? err.message : String(err)}`);
      }
    });
  } catch (err) {
    console.warn(`  ⚠ 사람인 이메일 파싱 실패: ${err instanceof Error ? err.message : String(err)}`);
  }

  return postings;
}

/**
 * 잡코리아 알림 이메일 파싱.
 *
 * 잡코리아 이메일은 보통:
 * - 제목: "잡코리아 공고 추천: [회사명] [직무]"
 * - 본문: 공고 상세 페이지 링크 (https://www.jobkorea.co.kr/Recruit/GI_Read/...)
 */
export function parseJobkoreaAlertEmail(html: string): CollectedJobPosting[] {
  const postings: CollectedJobPosting[] = [];
  if (!html) return postings;

  try {
    const $ = load(html);

    // 공고 링크 찾기
    const links = $('a[href*="jobkorea.co.kr"][href*="Recruit"]');

    links.each((_, elem) => {
      try {
        const href = $(elem).attr('href');
        const text = $(elem).text().trim();

        if (!href || !text) return;

        // 링크 텍스트에서 회사명/직무 추출
        const parts = text.split(/[\s-]+/).filter((p) => p.length > 0);
        if (parts.length < 2) return;

        const posting: CollectedJobPosting = {
          companyNameRaw: parts[0],
          role: parts.slice(1).join(' '),
          employmentType: '기타',
          url: href
        };

        postings.push(posting);
      } catch (err) {
        console.warn(`  ⚠ 잡코리아 링크 파싱 실패: ${err instanceof Error ? err.message : String(err)}`);
      }
    });
  } catch (err) {
    console.warn(`  ⚠ 잡코리아 이메일 파싱 실패: ${err instanceof Error ? err.message : String(err)}`);
  }

  return postings;
}

/**
 * 캐치 알림 이메일 파싱 (있는 경우).
 *
 * 캐치는 알림 이메일 기능이 명확하지 않으므로, 스텁으로 남겨둔다.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function parseCatchAlertEmail(_html: string): CollectedJobPosting[] {
  // TODO: 캐치 알림 이메일 구조 확인 후 구현
  console.log('  ℹ️ 캐치 이메일 파싱 미구현');
  return [];
}

/**
 * 이메일 발신자에 따라 적절한 파서 선택.
 */
export function parseAlertEmail(senderEmail: string, html: string): CollectedJobPosting[] {
  if (senderEmail.includes('saramin')) {
    return parseSaraminAlertEmail(html);
  } else if (senderEmail.includes('jobkorea')) {
    return parseJobkoreaAlertEmail(html);
  } else if (senderEmail.includes('catch')) {
    return parseCatchAlertEmail(html);
  }

  console.warn(`  ⚠ 미알려진 발신자: ${senderEmail}`);
  return [];
}
