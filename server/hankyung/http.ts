/**
 * 한경컨센서스 HTTP 요청 래퍼.
 *
 * 재시도는 server/scraping/common/http.ts의 fetchWithRetry를 그대로 사용한다.
 */
import { fetchWithRetry } from '../scraping/common/http';
import { SCRAPER_USER_AGENT } from '../scraping/common/user-agent';
import { HANKYUNG_CONSENSUS_BASE_URL } from './config';

export class HankyungScrapeError extends Error {
  readonly httpStatus?: number;

  constructor(message: string, httpStatus?: number) {
    super(message);
    this.name = 'HankyungScrapeError';
    this.httpStatus = httpStatus;
  }
}

export async function hankyungGet(path: string, searchParams: Record<string, string | number>): Promise<string> {
  const url = new URL(path, HANKYUNG_CONSENSUS_BASE_URL);
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetchWithRetry(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': SCRAPER_USER_AGENT
    }
  });

  if (!response.ok) {
    throw new HankyungScrapeError(`한경컨센서스 요청 실패: HTTP ${response.status}`, response.status);
  }

  return response.text();
}
