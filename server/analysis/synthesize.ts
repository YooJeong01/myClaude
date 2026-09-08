/**
 * 기업분석 종합.
 *
 * 3개 소스 수집 결과 → 프롬프트 → Gemini(JSON 강제) → result/sources 조립.
 * 소스 수집 자체는 Route Handler(T22) 가 하고, 여기는 "합치는" 책임만 진다.
 */

import { generateJson } from "../llm/client";
import { GEMINI_MODEL } from "../llm/config";
import { estimateCompanySize } from "./company-size";
import { buildSynthesisPrompt, SYNTHESIS_SYSTEM_INSTRUCTION } from "./prompt";
import {
  ANALYSIS_SCHEMA_VERSION,
  companyAnalysisResultSchema,
  type AnalysisSources,
  type CompanyAnalysisResult,
  type GeneratedAnalysis,
  type SynthesisInput,
  type SynthesisOutput
} from "./types";

/** 입력 소스를 그대로 sources 로 옮긴다 (LLM 관여 없음). */
function buildSources(input: SynthesisInput): AnalysisSources {
  return {
    dart: input.financials
      ? { bsnsYear: input.financials.bsnsYear, fsDiv: input.financials.fsDiv }
      : null,
    news: input.news.slice(0, 15).map((n) => ({
      title: n.title,
      link: n.link,
      pubDate: n.pubDate
    })),
    consensus: input.reports.slice(0, 15).map((r) => ({
      title: r.title,
      firm: r.securitiesFirm,
      url: r.originalUrl,
      publishedDate: r.publishedDate
    }))
  };
}

export async function synthesizeCompanyAnalysis(
  input: SynthesisInput
): Promise<SynthesisOutput> {
  const generated = await generateJson<GeneratedAnalysis>({
    prompt: buildSynthesisPrompt(input),
    schema: companyAnalysisResultSchema,
    systemInstruction: SYNTHESIS_SYSTEM_INSTRUCTION
  });

  const result: CompanyAnalysisResult = {
    schema_version: ANALYSIS_SCHEMA_VERSION,
    ...generated,
    estimated_size: estimateCompanySize(input.profile, input.financials)
  };

  return {
    result,
    sources: buildSources(input),
    model: GEMINI_MODEL
  };
}
