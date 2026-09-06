/**
 * 스크래핑용 공용 fetch 래퍼.
 * 429(rate limit) / 5xx 에러에 대해 지수백오프로 재시도한다.
 */
import { ScrapeError } from './types';
import type { FetchRetryOptions } from './types';
import { sleep } from './rate-limit';

export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options?: FetchRetryOptions
): Promise<Response> {
  const retries = options?.retries ?? 2;
  const baseDelayMs = options?.baseDelayMs ?? 1000;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // 15초 타임아웃
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);

      const response = await fetch(url, {
        ...init,
        signal: controller.signal
      });

      clearTimeout(timeout);

      // 성공 (2xx/3xx)
      if (response.ok || (response.status >= 300 && response.status < 400)) {
        return response;
      }

      // 재시도 가능한 에러 (429, 5xx)
      if (response.status === 429 || response.status >= 500) {
        if (attempt < retries) {
          const delayMs = baseDelayMs * Math.pow(2, attempt);
          console.log(`  ⚠ ${response.status} 응답, ${Math.round(delayMs)}ms 후 재시도... (${attempt + 1}/${retries})`);
          await sleep(delayMs);
          continue;
        }
      }

      // 재시도 불가 (4xx 등)
      throw ScrapeError.httpError(response.status, url);
    } catch (err) {
      // 타임아웃 처리
      if (err instanceof Error && err.name === 'AbortError') {
        lastError = ScrapeError.timeout(url);
        if (attempt < retries) {
          await sleep(baseDelayMs * Math.pow(2, attempt));
          continue;
        }
        throw lastError;
      }

      // 네트워크 에러
      if (err instanceof Error) {
        lastError = ScrapeError.networkError(err);
        if (attempt < retries) {
          console.log(`  ⚠ 네트워크 에러, ${Math.round(baseDelayMs * Math.pow(2, attempt))}ms 후 재시도... (${attempt + 1}/${retries})`);
          await sleep(baseDelayMs * Math.pow(2, attempt));
          continue;
        }
        throw lastError;
      }

      throw err;
    }
  }

  throw lastError ?? ScrapeError.networkError('unknown error after retries');
}
