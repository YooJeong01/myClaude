/**
 * 스크래핑 공통 타입 및 에러 클래스.
 */

export type ScrapeErrorCode = 'SITE_BLOCKED' | 'HTTP_ERROR' | 'PARSE_ERROR' | 'NETWORK_ERROR' | 'TIMEOUT';

export class ScrapeError extends Error {
  readonly code: ScrapeErrorCode;

  constructor(code: ScrapeErrorCode, message: string) {
    super(message);
    this.name = 'ScrapeError';
    this.code = code;
  }

  static siteBlocked(site: string): ScrapeError {
    return new ScrapeError('SITE_BLOCKED', `${site} 이 요청을 차단했거나 접근 불가`);
  }

  static httpError(status: number, url: string): ScrapeError {
    return new ScrapeError('HTTP_ERROR', `HTTP ${status}: ${url}`);
  }

  static parseError(message: string): ScrapeError {
    return new ScrapeError('PARSE_ERROR', `파싱 실패: ${message}`);
  }

  static networkError(cause: unknown): ScrapeError {
    const msg = cause instanceof Error ? cause.message : String(cause);
    return new ScrapeError('NETWORK_ERROR', `네트워크 에러: ${msg}`);
  }

  static timeout(url: string): ScrapeError {
    return new ScrapeError('TIMEOUT', `타임아웃: ${url}`);
  }
}

export interface FetchRetryOptions {
  retries?: number;
  baseDelayMs?: number;
}
