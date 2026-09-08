/**
 * 기업분석 종합 타입.
 *
 * 확장 전제로 설계한다:
 *  - `company_analyses.result` 는 jsonb 라 필드 추가 시 마이그레이션 불필요.
 *  - `schema_version` 으로 구 데이터를 구분한다. 필드를 추가/변경하면 버전을 올린다.
 *  - LLM 이 만드는 부분(CompanyAnalysisResult)과 코드가 조립하는 부분(AnalysisSources)을 분리한다.
 *  - 소스가 늘어나면 SynthesisInput 에 필드만 추가하고 prompt.ts / synthesize.ts 를 손본다.
 */

import { Type, type Schema } from "@google/genai";

import type { DartCompanyProfile, DartKeyFinancials } from "../dart/types";
import type { HankyungReport } from "../hankyung/types";
import type { SanitizedNewsItem } from "../naver/types";
import type { CompanySizeEstimate } from "./company-size";

/** result 스키마 버전. 필드를 바꾸면 올린다. */
export const ANALYSIS_SCHEMA_VERSION = 2;

/**
 * LLM 이 생성하는 종합 리포트 본문. `company_analyses.result` 에 저장된다.
 * `schema_version` 은 코드가 채우므로 아래 Gemini 스키마에는 넣지 않는다.
 */
export interface CompanyAnalysisResult {
  schema_version: number;
  /** 회사 한 문단 개요 */
  overview: string;
  /** 제공된 DART 재무 요약 (매출·영업이익·순이익 추세) */
  financials_summary: string;
  /** 제공된 뉴스에서 뽑은 최근 이슈 테마 */
  recent_news_themes: string[];
  /** 제공된 애널리스트 리포트 제목들을 종합한 시각 (원문 인용 없이) */
  analyst_view: string;
  /** 리스크 요인 */
  risks: string[];
  /** 지원동기에 쓸 구체적 소재 (Day 4 매칭에서 사용) */
  talking_points: string[];
  /** 공개 DART 자료 기반 코드 휴리스틱 규모 추정. LLM 생성 필드가 아니다. */
  estimated_size?: CompanySizeEstimate;
}

/** LLM 이 채우는 필드 (schema_version 제외). */
export type GeneratedAnalysis = Omit<
  CompanyAnalysisResult,
  "schema_version" | "estimated_size"
>;

/**
 * Gemini responseSchema. 위 CompanyAnalysisResult 와 **수동으로 동기화** 유지.
 * 필드를 추가하면: 인터페이스 + 이 스키마 + ANALYSIS_SCHEMA_VERSION 세 곳을 함께 고친다.
 * estimated_size 는 코드가 채우므로 이 Gemini 스키마에 넣지 않는다.
 */
export const companyAnalysisResultSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overview: { type: Type.STRING, description: "회사 한 문단 개요" },
    financials_summary: {
      type: Type.STRING,
      description: "제공된 DART 재무 요약 (매출·영업이익·순이익 추세). 자료에 없으면 그렇게 명시"
    },
    recent_news_themes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "제공된 뉴스에서 뽑은 최근 이슈 테마 (3~6개)"
    },
    analyst_view: {
      type: Type.STRING,
      description: "제공된 애널리스트 리포트 제목들을 종합한 시각. 원문을 옮기지 말 것"
    },
    risks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "리스크 요인 (2~5개)" },
    talking_points: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "이 회사 지원동기로 쓸 수 있을 만큼 구체적인 소재 (3~5개)"
    }
  },
  required: [
    "overview",
    "financials_summary",
    "recent_news_themes",
    "analyst_view",
    "risks",
    "talking_points"
  ]
};

/**
 * result 의 출처. LLM 이 아니라 수집 단계에서 코드로 조립해 `company_analyses.sources` 에 저장.
 * 프론트에서 "근거 보기" 링크로 쓴다.
 */
export interface AnalysisSources {
  dart: { bsnsYear: string; fsDiv: string } | null;
  news: { title: string; link: string; pubDate: string }[];
  consensus: { title: string; firm: string; url: string; publishedDate: string }[];
}

/**
 * synthesizeCompanyAnalysis 입력. 소스가 늘어나면 여기에 필드를 추가한다.
 * 각 소스는 "없을 수 있음"(수집 실패/무자료)을 표현한다.
 */
export interface SynthesisInput {
  /** 공고 직무. 있으면 talking_points 를 직무에 맞춘다. */
  role?: string;
  profile: DartCompanyProfile;
  financials: DartKeyFinancials | null;
  news: SanitizedNewsItem[];
  reports: HankyungReport[];
}

/** synthesizeCompanyAnalysis 반환. Route Handler 가 company_analyses insert 에 쓴다. */
export interface SynthesisOutput {
  result: CompanyAnalysisResult;
  sources: AnalysisSources;
  model: string;
}
