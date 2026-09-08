/**
 * T3 스키마 스모크 테스트.
 *
 * 마이그레이션(`supabase/migrations/20260830155347_init.sql`)을 Supabase 대시보드에서
 * 실행한 뒤 돌린다. 테스트 유저/행을 만들었다가 끝에서 모두 지운다.
 *
 * 실행: `pnpm exec tsx --env-file=.env.local server/jobs/verify-schema.ts`
 *   (로컬 Node 20 은 `NODE_OPTIONS=--experimental-websocket` 필요)
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  throw new Error("환경변수 누락. `--env-file=.env.local` 로 실행하세요.");
}

const supabaseUrl = url;
const supabaseAnonKey = anonKey;
const supabaseServiceKey = serviceKey;

const admin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});
const anon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function ok(message: string): void {
  console.log(`  ✓ ${message}`);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const created: { table: string; id: string }[] = [];

async function main(): Promise<void> {
  console.log("1. 스키마 존재 확인 (admin)");
  for (const table of [
    "profiles",
    "companies",
    "job_postings",
    "company_analyses",
    "user_experiences",
    "motivation_drafts"
  ] as const) {
    const { error } = await admin.from(table).select("*").limit(0);
    assert(!error, `${table}: ${error?.message} — 마이그레이션을 먼저 실행하세요`);
    ok(table);
  }

  console.log("2. 테스트 유저 생성 → handle_new_user 트리거 확인");
  const email = `t3-smoke-${Date.now()}@example.com`;
  const { data: userRes, error: userErr } = await admin.auth.admin.createUser({
    email,
    password: "smoke-test-pw-123456",
    email_confirm: true
  });
  assert(!userErr && userRes.user, `createUser: ${userErr?.message}`);
  const userId = userRes.user.id;
  ok(`user ${userId}`);

  const otherEmail = `t3-smoke-other-${Date.now()}@example.com`;
  const { data: otherUserRes, error: otherUserErr } =
    await admin.auth.admin.createUser({
      email: otherEmail,
      password: "smoke-test-pw-123456",
      email_confirm: true
    });
  assert(!otherUserErr && otherUserRes.user, `createUser(other): ${otherUserErr?.message}`);
  const otherUserId = otherUserRes.user.id;
  ok(`other user ${otherUserId}`);

  const authed = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { error: signInErr } = await authed.auth.signInWithPassword({
    email,
    password: "smoke-test-pw-123456"
  });
  assert(!signInErr, `signInWithPassword: ${signInErr?.message}`);
  ok("authenticated client 준비됨");

  const { data: prof, error: profErr } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  assert(!profErr, `profiles select: ${profErr?.message}`);
  assert(prof, "트리거가 profiles 행을 만들지 않음");
  ok("profiles 행 자동 생성됨");

  console.log("3. companies insert (admin)");
  const { data: co, error: coErr } = await admin
    .from("companies")
    .insert({ corp_code: `S${Date.now()}`.slice(0, 8), name: "스모크테스트(주)" })
    .select("id")
    .single();
  assert(!coErr && co, `companies insert: ${coErr?.message}`);
  created.push({ table: "companies", id: co.id });
  ok(`company ${co.id}`);

  console.log("4. job_postings insert + 중복(dedup) 제약");
  const posting = {
    user_id: userId,
    company_name_raw: "  스모크테스트(주) ",
    role: " 백엔드 개발자 ",
    employment_type: "정규직",
    posted_at: "2026-08-01",
    source: "manual",
    url: "https://example.com/job/1"
  };
  const { data: jp, error: jpErr } = await admin
    .from("job_postings")
    .insert(posting)
    .select("id, company_key, role_norm")
    .single();
  assert(!jpErr && jp, `job_postings insert: ${jpErr?.message}`);
  created.push({ table: "job_postings", id: jp.id });
  ok(`posting ${jp.id} (company_key='${jp.company_key}', role_norm='${jp.role_norm}')`);

  const { error: dupErr } = await admin.from("job_postings").insert(posting);
  assert(dupErr, "중복 insert 가 막히지 않음 (nulls not distinct 미지원?)");
  ok(`중복 거부됨 (${dupErr.code})`);

  console.log("5. job_postings source 값 검증 (Day2 스크래핑)");
  const { data: jp2, error: jpErr2 } = await admin
    .from("job_postings")
    .insert({
      user_id: userId,
      company_name_raw: "스크래핑테스트(주)",
      role: "프론트엔드",
      employment_type: "정규직",
      posted_at: "2026-09-05",
      source: "scrape_saramin",
      url: "https://www.saramin.co.kr/zf_user/jobs/relay/view?rec_idx=1234"
    })
    .select("id, source")
    .single();
  assert(!jpErr2 && jp2, `job_postings scrape_saramin insert: ${jpErr2?.message}`);
  created.push({ table: "job_postings", id: jp2.id });
  ok(`scrape_saramin source 허용됨`);

  const { error: jpInvalidErr } = await admin.from("job_postings").insert({
    user_id: userId,
    company_name_raw: "불가능테스트(주)",
    role: "프론트엔드",
    employment_type: "정규직",
    posted_at: "2026-09-05",
    source: "invalid_source",
    url: "https://example.com/job/2"
  });
  assert(jpInvalidErr, "invalid_source 가 reject 되지 않음 (체크 제약 실패)");
  ok(`invalid_source 거부됨 (${jpInvalidErr.code})`);

  console.log("6. company_analyses insert");
  const { data: ca, error: caErr } = await admin
    .from("company_analyses")
    .insert({
      user_id: userId,
      company_id: co.id,
      role: "백엔드 개발자",
      job_posting_id: jp.id,
      result: { summary: "smoke" }
    })
    .select("id")
    .single();
  assert(!caErr && ca, `company_analyses insert: ${caErr?.message}`);
  created.push({ table: "company_analyses", id: ca.id });
  ok(`analysis ${ca.id}`);

  console.log("7. user_experiences insert + RLS 위장 insert 거부");
  const { data: exp, error: expErr } = await authed
    .from("user_experiences")
    .insert({
      user_id: userId,
      title: "스모크 경험",
      body: "스키마 검증용 사용자 경험"
    })
    .select("id")
    .single();
  assert(!expErr && exp, `user_experiences insert: ${expErr?.message}`);
  created.push({ table: "user_experiences", id: exp.id });
  ok(`experience ${exp.id}`);

  const { error: expMasqueradeErr } = await authed.from("user_experiences").insert({
    user_id: otherUserId,
    title: "위장 경험",
    body: "다른 user_id 로 insert 시도"
  });
  assert(expMasqueradeErr, "user_experiences 타 유저 user_id insert 가 거부되지 않음");
  ok(`user_experiences 위장 insert 거부됨 (${expMasqueradeErr.code})`);

  console.log("8. motivation_drafts insert + RLS 위장 insert/update 거부");
  const { data: draft, error: draftErr } = await authed
    .from("motivation_drafts")
    .insert({
      user_id: userId,
      company_analysis_id: ca.id,
      job_posting_id: jp.id,
      experience_ids: [exp.id],
      result: { summary: "motivation smoke" },
      model: "smoke-model"
    })
    .select("id")
    .single();
  assert(!draftErr && draft, `motivation_drafts insert: ${draftErr?.message}`);
  created.push({ table: "motivation_drafts", id: draft.id });
  ok(`motivation draft ${draft.id}`);

  const { error: draftMasqueradeErr } = await authed.from("motivation_drafts").insert({
    user_id: otherUserId,
    company_analysis_id: ca.id,
    experience_ids: [exp.id],
    result: { summary: "masquerade" }
  });
  assert(draftMasqueradeErr, "motivation_drafts 타 유저 user_id insert 가 거부되지 않음");
  ok(`motivation_drafts 위장 insert 거부됨 (${draftMasqueradeErr.code})`);

  // motivation_drafts 는 불변 이력: update/delete 정책이 없다.
  // Postgres RLS 는 정책 없는 update/delete 를 에러가 아니라 "0행 영향"으로 조용히 필터링하므로,
  // 에러 발생이 아니라 "행이 실제로 안 바뀌는지"로 불변성을 확인한다.
  const { data: draftUpdRows, error: draftUpdErr } = await authed
    .from("motivation_drafts")
    .update({ model: "updated-model" })
    .eq("id", draft.id)
    .select();
  assert(!draftUpdErr, `motivation_drafts update 예기치 못한 에러: ${draftUpdErr?.message}`);
  assert(
    (draftUpdRows?.length ?? 0) === 0,
    `motivation_drafts update 가 ${draftUpdRows?.length}행에 반영됨 (불변이어야 함)`
  );

  const { data: draftDelRows, error: draftDelErr } = await authed
    .from("motivation_drafts")
    .delete()
    .eq("id", draft.id)
    .select();
  assert(!draftDelErr, `motivation_drafts delete 예기치 못한 에러: ${draftDelErr?.message}`);
  assert(
    (draftDelRows?.length ?? 0) === 0,
    `motivation_drafts delete 가 ${draftDelRows?.length}행에 반영됨 (불변이어야 함)`
  );

  const { data: draftAfter, error: draftAfterErr } = await admin
    .from("motivation_drafts")
    .select("model")
    .eq("id", draft.id)
    .single();
  assert(!draftAfterErr && draftAfter, `motivation_drafts 재조회 실패: ${draftAfterErr?.message}`);
  assert(
    draftAfter.model === "smoke-model",
    `motivation_drafts 행이 변경됨 (model='${draftAfter.model}', 'smoke-model' 이어야 함)`
  );
  ok("motivation_drafts update/delete 무효 (0행, 행 불변)");

  console.log("9. RLS: anon select");
  const { data: anonCa } = await anon.from("company_analyses").select("id");
  assert((anonCa?.length ?? 0) === 0, `anon 이 company_analyses ${anonCa?.length}행 읽음`);
  ok("anon → company_analyses 0행 (차단)");

  const { data: anonCo } = await anon.from("companies").select("id");
  assert((anonCo?.length ?? 0) === 0, `anon 이 companies ${anonCo?.length}행 읽음`);
  ok("anon → companies 0행 (authenticated 전용)");

  console.log("\n정리");
  for (const { table, id } of created.reverse()) {
    const { error } = await admin.from(table).delete().eq("id", id);
    if (error) {
      console.warn(`  ! ${table} ${id}: ${error.message}`);
    } else {
      ok(`${table} ${id} 삭제`);
    }
  }
  const { error: delUserErr } = await admin.auth.admin.deleteUser(userId);
  if (delUserErr) {
    console.warn(`  ! user: ${delUserErr.message}`);
  } else {
    ok("user 삭제 (profiles cascade)");
  }
  const { error: delOtherUserErr } = await admin.auth.admin.deleteUser(otherUserId);
  if (delOtherUserErr) {
    console.warn(`  ! other user: ${delOtherUserErr.message}`);
  } else {
    ok("other user 삭제 (profiles cascade)");
  }

  console.log("\n✅ 전부 통과");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
