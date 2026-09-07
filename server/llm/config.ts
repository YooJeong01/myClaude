/**
 * Gemini LLM 설정.
 *
 * 기업분석 종합(server/analysis)에서 DART 재무 + 네이버 뉴스 + 한경컨센서스를
 * 하나의 구조화된 리포트로 합칠 때 사용한다.
 *
 * 제공자로 Google Gemini 무료 티어를 쓴다. 이유: Anthropic/OpenAI API 는
 * 구독과 별도 유료이고, GitHub Models 는 2026-07-30 종료됨.
 * 키 발급: https://aistudio.google.com/apikey (카드 불필요, 구글 계정만).
 * 무료 한도(대략): 10 RPM / 250 RPD. "다시 분석하기" 는 수동 버튼이라 충분.
 */

import { LlmError } from "./errors";

/**
 * flash 티어 모델. 한국어 종합 품질이 부족하면 pro 티어로 올린다
 * (무료 한도는 더 낮다). 모델 세대가 바뀌면 AI Studio 에서 현재 ID 를 재확인할 것
 * (2026-09 기준 gemini-2.5-flash 는 신규 사용자에게 닫혀 3.x 라인으로 이동).
 */
export const GEMINI_MODEL = "gemini-3.6-flash";

/** 종합 리포트는 항목이 여러 개라 넉넉히. */
export const MAX_OUTPUT_TOKENS = 4096;

/** 사실 요약이라 낮게. */
export const TEMPERATURE = 0.3;

/**
 * API 키. 호출 시점에 읽어서 없으면 명확히 실패한다 (dart/config.ts 와 동일 패턴).
 */
export function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new LlmError(
      "NO_API_KEY",
      "GEMINI_API_KEY 환경변수가 없습니다. https://aistudio.google.com/apikey 에서 발급받아 .env.local 에 넣으세요."
    );
  }
  return key;
}
