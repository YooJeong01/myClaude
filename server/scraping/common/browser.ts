/**
 * Playwright 헤드리스 브라우저 래퍼 (잡코리아/캐치용).
 *
 * CSR 사이트를 렌더링하려면 실제 브라우저 자동화 도구가 필요하다.
 * Playwright의 설정과 정리를 일괄 처리한다.
 */
import { chromium, type Browser, type Page } from 'playwright';
import { ScrapeError } from './types';

export async function launchBrowser(): Promise<Browser> {
  try {
    return await chromium.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled']
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw ScrapeError.siteBlocked(`Playwright 브라우저 시작 실패: ${detail}`);
  }
}

export async function withPage<T>(
  browser: Browser,
  fn: (page: Page) => Promise<T>
): Promise<T> {
  // 직접 newPage() 호출 (context는 선택사항)
  const page = await browser.newPage();

  try {
    // 기본 타임아웃 15초
    page.setDefaultTimeout(15_000);
    page.setDefaultNavigationTimeout(15_000);

    return await fn(page);
  } finally {
    await page.close();
  }
}
