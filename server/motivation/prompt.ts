import type { CompanyAnalysisResult } from "../analysis/types";
import type { MotivationInput } from "./types";

export const MOTIVATION_SYSTEM_INSTRUCTION = `너는 채용 지원자의 지원동기 소재를 정리하는 코치다.
아래 원칙을 지킨다:
- 기업분석 결과와 지원자 경험만 근거로 삼는다. 자료에 없는 사실을 지어내지 않는다.
- 과장 없이 한국어로 쓴다.
- 경험과 회사 특성을 억지로 엮지 말고 실제로 맞닿는 지점만 각도로 만든다.
- 맞닿는 각도가 적으면 적게 낸다.
- draft_sentences 는 제출용 완성문이 아니라 지원동기에 넣을 수 있는 초안 문장으로 쓴다.`;

function listSection(title: string, items: string[]): string {
  if (items.length === 0) {
    return `## ${title}\n(자료 없음)`;
  }
  return `## ${title}\n${items.map((item, i) => `${i + 1}. ${item}`).join("\n")}`;
}

function analysisSection(analysis: CompanyAnalysisResult): string {
  return [
    `## 회사 개요\n${analysis.overview}`,
    "",
    `## 재무 요약\n${analysis.financials_summary}`,
    "",
    listSection("최근 뉴스 테마", analysis.recent_news_themes),
    "",
    `## 애널리스트 시각\n${analysis.analyst_view}`,
    "",
    listSection("리스크", analysis.risks),
    "",
    listSection("지원동기 소재 후보", analysis.talking_points)
  ].join("\n");
}

function experiencesSection(experiences: MotivationInput["experiences"]): string {
  return experiences
    .map((experience, i) =>
      [`${i + 1}. ${experience.title}`, experience.body].join("\n")
    )
    .join("\n\n");
}

export function buildMotivationPrompt(input: MotivationInput): string {
  return [
    `# 회사: ${input.companyName}`,
    `지원 직무: ${input.role}`,
    "",
    "# 기업분석 결과",
    analysisSection(input.analysis),
    "",
    "# 지원자 경험",
    experiencesSection(input.experiences),
    "",
    "---",
    "위 기업분석과 지원자 경험만 근거로 지정된 JSON 스키마에 맞춰 지원동기 소재 초안을 작성하라."
  ].join("\n");
}
