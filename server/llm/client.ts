/**
 * Gemini 클라이언트 래퍼.
 *
 * server/analysis 는 여기의 generateJson() 만 쓴다. Gemini 가 responseSchema 로
 * 출력 구조를 강제하므로 호출부의 파싱 부담이 줄어든다.
 */

import { ApiError, GoogleGenAI, type Schema } from "@google/genai";

import {
  GEMINI_MODEL,
  MAX_OUTPUT_TOKENS,
  TEMPERATURE,
  getGeminiApiKey
} from "./config";
import { LlmError } from "./errors";

let cachedClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey: getGeminiApiKey() });
  }
  return cachedClient;
}

/** ApiError → LlmError 로 변환. */
function toLlmError(err: unknown): LlmError {
  if (err instanceof LlmError) {
    return err;
  }
  if (err instanceof ApiError) {
    if (err.status === 429) {
      return new LlmError(
        "RATE_LIMITED",
        `Gemini 무료 티어 한도 초과: ${err.message}`,
        429
      );
    }
    if (err.status >= 400 && err.status < 500) {
      return new LlmError("BAD_REQUEST", err.message, err.status);
    }
    return new LlmError("LLM_ERROR", err.message, err.status);
  }
  const message = err instanceof Error ? err.message : String(err);
  return new LlmError("LLM_ERROR", `Gemini 호출 실패: ${message}`);
}

export interface GenerateTextOptions {
  prompt: string;
  systemInstruction?: string;
}

/** 자유 텍스트 응답. 스모크 테스트 등 간단한 용도. */
export async function generateText(options: GenerateTextOptions): Promise<string> {
  try {
    const response = await getClient().models.generateContent({
      model: GEMINI_MODEL,
      contents: options.prompt,
      config: {
        systemInstruction: options.systemInstruction,
        temperature: TEMPERATURE,
        maxOutputTokens: MAX_OUTPUT_TOKENS
      }
    });

    const text = response.text?.trim();
    if (!text) {
      throw new LlmError(
        "EMPTY_RESPONSE",
        "Gemini 가 텍스트를 반환하지 않았습니다 (안전 필터 또는 빈 응답)."
      );
    }
    return text;
  } catch (err) {
    throw toLlmError(err);
  }
}

export interface GenerateJsonOptions {
  prompt: string;
  /** Gemini Schema (OpenAPI 서브셋). 출력 구조를 강제한다. */
  schema: Schema;
  systemInstruction?: string;
}

/**
 * 스키마를 강제한 JSON 응답을 파싱해서 돌려준다.
 * 호출부가 제네릭으로 결과 타입을 지정한다 — Gemini 가 스키마를 지키므로
 * 런타임 검증은 최소한(파싱 성공 여부)만 한다.
 */
export async function generateJson<T>(options: GenerateJsonOptions): Promise<T> {
  let raw: string | undefined;
  try {
    const response = await getClient().models.generateContent({
      model: GEMINI_MODEL,
      contents: options.prompt,
      config: {
        systemInstruction: options.systemInstruction,
        temperature: TEMPERATURE,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        responseMimeType: "application/json",
        responseSchema: options.schema
      }
    });
    raw = response.text?.trim();
  } catch (err) {
    throw toLlmError(err);
  }

  if (!raw) {
    throw new LlmError(
      "EMPTY_RESPONSE",
      "Gemini 가 JSON 을 반환하지 않았습니다 (안전 필터 또는 빈 응답)."
    );
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new LlmError(
      "INVALID_JSON",
      `Gemini 응답을 JSON 으로 파싱하지 못했습니다: ${raw.slice(0, 200)}`
    );
  }
}
