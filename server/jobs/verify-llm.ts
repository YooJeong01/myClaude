/**
 * Gemini LLM 클라이언트 스모크 테스트.
 *
 * GEMINI_API_KEY 로 실제 왕복이 되는지, JSON 스키마 강제가 동작하는지 확인한다.
 *
 * 실행:
 *   pnpm exec tsx --env-file=.env.local server/jobs/verify-llm.ts
 */
import { Type } from "@google/genai";

import { generateJson, generateText } from "../llm/client";

async function main(): Promise<void> {
  console.log("🚀 Gemini LLM 클라이언트 테스트\n");

  console.log("1. 자유 텍스트");
  const text = await generateText({
    prompt: "한국어로 '연결 정상'이라고만 답해줘.",
    systemInstruction: "너는 간결하게만 답한다."
  });
  console.log(`  ✓ 응답: ${text}\n`);

  console.log("2. JSON 스키마 강제");
  const json = await generateJson<{ company: string; sector: string; keywords: string[] }>({
    prompt: "삼성전자를 한 줄로 소개하고 관련 키워드 3개를 뽑아줘.",
    schema: {
      type: Type.OBJECT,
      properties: {
        company: { type: Type.STRING },
        sector: { type: Type.STRING },
        keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["company", "sector", "keywords"]
    }
  });
  console.log(`  ✓ company: ${json.company}`);
  console.log(`  ✓ sector:  ${json.sector}`);
  console.log(`  ✓ keywords: ${json.keywords.join(", ")}\n`);

  console.log("✅ 테스트 완료");
}

main().catch((error: unknown) => {
  const msg = error instanceof Error ? error.message : String(error);
  console.error("❌ 오류:", msg);
  process.exit(1);
});
