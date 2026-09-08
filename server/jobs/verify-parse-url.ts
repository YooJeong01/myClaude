/**
 * T38 URL 단건 파싱 스모크.
 *
 * 실행:
 *   pnpm exec tsx --env-file=.env.local server/jobs/verify-parse-url.ts <url...>
 */

import { parseJobPostingUrl } from "../job-postings/parse-url";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function main(): Promise<void> {
  const urls = process.argv.slice(2);
  assert(urls.length > 0, "검증할 공개 채용공고 URL을 인자로 전달하세요.");

  for (const url of urls) {
    console.log(`\n1. URL 파싱: ${url}`);
    const parsed = await parseJobPostingUrl(url);
    console.log(JSON.stringify(parsed, null, 2));
    assert(
      parsed.companyNameRaw || parsed.role || parsed.rawText,
      "회사명/직무/본문 중 하나 이상은 추출되어야 합니다."
    );
    console.log("  ✓ 부분 파싱 성공");
  }

  console.log("\n✅ T38 URL 파싱 검증 완료");
}

main().catch((err) => {
  console.error("❌ 오류:", err.message);
  process.exit(1);
});
