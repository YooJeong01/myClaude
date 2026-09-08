import { createAdminClient } from "../supabase/admin";
import { isRelevantRole } from "../scraping/common/role-filter";

async function main(): Promise<void> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("job_postings")
    .select("id, company_name_raw, role, raw_text, url")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    throw error;
  }

  const irrelevant = data.filter(
    (posting) => !isRelevantRole(posting.role, posting.raw_text ?? undefined)
  );

  console.log(`전체 샘플: ${data.length}건`);
  console.log(`필터 제외 대상: ${irrelevant.length}건`);
  for (const posting of irrelevant.slice(0, 20)) {
    console.log(
      `- ${posting.company_name_raw ?? "회사명 미입력"} / ${posting.role} / ${posting.url ?? "URL 없음"}`
    );
  }
  console.log("\nDry-run only: 실제 삭제는 수행하지 않았습니다.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
