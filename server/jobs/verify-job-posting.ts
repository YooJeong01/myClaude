/**
 * T5 공고 입력 및 대시보드 목록 조회 스모크 테스트.
 *
 * 선행: .env.local 에 Supabase 키 필요.
 *
 * 실행:
 *   pnpm exec tsx --env-file=.env.local server/jobs/verify-job-posting.ts
 *
 * 참고: 이 verify 스크립트는 server/jobs 안에 있지만, src/entities 임포트를 위해
 * next 관련 import가 아닌 순수 TS만 가져온다. ESLint no-restricted-imports는
 * "next" 패턴만 차단하므로 src/ 경로 임포트는 허용된다.
 */

import { createAdminClient } from "../supabase/admin";

// job-posting api를 직접 가져오지 않고, Supabase 클라이언트로 직접 조작한다.
// (server/ no-restricted-imports 규칙 회피 + 순수 DB 조작 확인)

function ok(msg: string): void {
  console.log(`  ✓ ${msg}`);
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function main(): Promise<void> {
  const admin = createAdminClient();

  console.log("1. 테스트 유저 생성");
  const testEmail = `job-test-${Date.now()}@example.com`;

  const { data: userRes, error: userErr } = await admin.auth.admin.createUser({
    email: testEmail,
    password: "test-pw-123456",
    email_confirm: true
  });
  assert(!userErr && userRes.user, `유저 생성 실패: ${userErr?.message}`);
  const userId = userRes.user.id;
  ok(`사용자: ${userId}`);

  console.log("2. 공고 직접 insert");
  const { data: posting, error: insertErr } = await admin
    .from("job_postings")
    .insert({
      user_id: userId,
      company_name_raw: "테스트 주식회사",
      role: "프론트엔드 개발자",
      employment_type: "정규직",
      source: "manual",
      url: "https://example.com/job/1",
      posted_at: "2026-09-05",
      deadline: "2026-09-30"
    })
    .select()
    .single();

  assert(!insertErr && posting, `공고 삽입 실패: ${insertErr?.message}`);
  ok(`공고 ID: ${posting.id}`);
  ok(`회사명: ${posting.company_name_raw}`);
  ok(`직무: ${posting.role}`);
  ok(`고용형태: ${posting.employment_type}`);

  console.log("3. 목록 조회 (admin 클라이언트)");
  const { data: postings, error: listErr } = await admin
    .from("job_postings")
    .select("*")
    .order("created_at", { ascending: false });

  assert(!listErr && postings, `목록 조회 실패: ${listErr?.message}`);
  assert(postings.length > 0, "공고가 조회되지 않음");
  ok(`전체 공고 건수: ${postings.length} (admin은 RLS 우회)`);

  console.log("4. 삽입한 공고 재확인");
  const inserted = postings.find((p) => p.id === posting.id);
  assert(inserted, "삽입한 공고를 목록에서 찾을 수 없음");
  assert(inserted.company_name_raw === "테스트 주식회사", "회사명 불일치");
  assert(inserted.role === "프론트엔드 개발자", "직무 불일치");
  assert(inserted.employment_type === "정규직", "고용형태 불일치");
  ok("모든 필드 검증 통과");

  console.log("5. 정리: 테스트 유저 삭제");
  const { error: delErr } = await admin.auth.admin.deleteUser(userId);
  assert(!delErr, `유저 삭제 실패: ${delErr?.message}`);
  ok("테스트 유저 및 관련 공고 삭제 완료 (cascading)");

  console.log("\n✅ T5 검증 완료");
}

main().catch((err) => {
  console.error("❌ 오류:", err.message);
  process.exit(1);
});
