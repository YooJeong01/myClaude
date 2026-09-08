import { Type, type Schema } from "@google/genai";

import type { CompanyAnalysisResult } from "../analysis/types";

/** result 스키마 버전. 필드를 바꾸면 올린다. */
export const MOTIVATION_SCHEMA_VERSION = 1;

/**
 * 지원동기 소재 초안. `motivation_drafts.result` 에 저장된다.
 * `schema_version` 은 코드가 채우므로 아래 Gemini 스키마에는 넣지 않는다.
 */
export interface MotivationResult {
  schema_version: number;
  angles: {
    /** 기업분석에서 잡은 지원 각도 (talking_point 기반) */
    point: string;
    /** 연결되는 개인 경험 (경험 title) */
    matched_experience: string;
    /** 왜 이 경험이 이 각도와 실제로 맞닿는지 */
    connection: string;
    /** 지원동기에 넣을 초안 문장 2~3개 (완성문 아님) */
    draft_sentences: string[];
  }[];
  /** 각도들을 엮은 예시 흐름. 제출용 완성 문단이 아니다. */
  summary_paragraph: string;
}

/** LLM 이 채우는 필드 (schema_version 제외). */
export type GeneratedMotivation = Omit<MotivationResult, "schema_version">;

/**
 * Gemini responseSchema. 위 MotivationResult 와 **수동으로 동기화** 유지.
 * 필드를 추가하면: 인터페이스 + 이 스키마 + MOTIVATION_SCHEMA_VERSION 세 곳을 함께 고친다.
 */
export const motivationResultSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    angles: {
      type: Type.ARRAY,
      description:
        "기업분석 각도와 실제로 맞닿는 개인 경험 매칭. 억지 연결이면 만들지 않는다.",
      items: {
        type: Type.OBJECT,
        properties: {
          point: {
            type: Type.STRING,
            description: "기업분석에서 잡은 지원 각도 (talking_point 기반)"
          },
          matched_experience: {
            type: Type.STRING,
            description: "연결되는 개인 경험 title"
          },
          connection: {
            type: Type.STRING,
            description: "왜 이 경험이 이 각도와 실제로 맞닿는지에 대한 근거"
          },
          draft_sentences: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "지원동기에 넣을 초안 문장 2~3개. 완성문이 아니라 소재 문장"
          }
        },
        required: ["point", "matched_experience", "connection", "draft_sentences"]
      }
    },
    summary_paragraph: {
      type: Type.STRING,
      description: "각도들을 엮은 예시 흐름. 제출용 완성 문단이 아님"
    }
  },
  required: ["angles", "summary_paragraph"]
};

export interface MotivationInput {
  role: string;
  companyName: string;
  analysis: CompanyAnalysisResult;
  experiences: { title: string; body: string }[];
}

export interface MotivationOutput {
  result: MotivationResult;
  model: string;
}
