import { DartApiError } from "./types";

export const DART_BASE_URL = "https://opendart.fss.or.kr/api";

/**
 * DART API 인증키. 서버 전용 시크릿(`DART_API_KEY`).
 * 호출 시점에 읽어서 없으면 명확히 실패한다.
 */
export function getDartApiKey(): string {
  const key = process.env.DART_API_KEY;
  if (!key) {
    throw new DartApiError(
      "NO_API_KEY",
      "DART_API_KEY 환경변수가 없습니다. .env.local 에 발급받은 키를 넣으세요."
    );
  }
  return key;
}
