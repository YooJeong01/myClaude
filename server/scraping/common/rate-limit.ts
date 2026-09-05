/**
 * 요청 간 최소 대기 시간.
 *
 * 저강도 개인 사용 목적으로, 요청 빈도를 제한한다.
 * 각 사이트의 robots.txt 및 이용약관을 존중하기 위함.
 */

export const MIN_DELAY_MS = {
  saramin: 2000, // cheerio + fetch, 상대적으로 가벼움
  jobkorea: 3000, // Playwright 네비게이션
  catch: 3000 // Playwright 네비게이션
} as const;

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
