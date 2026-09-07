/**
 * LLM 호출 에러 도메인 타입.
 *
 * Route Handler 가 status 코드로 매핑하기 쉽도록 code 를 붙인다
 * (server/dart/types.ts 의 DartApiError 와 같은 방식).
 */

export type LlmErrorCode =
  | "NO_API_KEY"
  | "RATE_LIMITED" // 429 / 무료 티어 한도 초과
  | "BAD_REQUEST" // 4xx (프롬프트/스키마 문제)
  | "EMPTY_RESPONSE" // 모델이 텍스트를 반환하지 않음 (안전필터 등)
  | "INVALID_JSON" // JSON 강제했는데 파싱 실패
  | "LLM_ERROR"; // 그 외 (5xx, 네트워크)

export class LlmError extends Error {
  readonly code: LlmErrorCode;
  readonly httpStatus?: number;

  constructor(code: LlmErrorCode, message: string, httpStatus?: number) {
    super(message);
    this.name = "LlmError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}
