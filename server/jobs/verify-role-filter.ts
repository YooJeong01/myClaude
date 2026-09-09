import {
  classifyRole,
  isRelevantRole,
  type RoleRelevance
} from "../scraping/common/role-filter";

type Case = {
  role: string;
  text?: string;
  expected: RoleRelevance;
};

const cases: Case[] = [
  // 강한 신호
  { role: "프론트엔드 개발자", expected: "relevant" },
  { role: "웹 퍼블리셔", expected: "relevant" },
  { role: "React 개발자", expected: "relevant" },
  { role: "풀스택 엔지니어", expected: "relevant" },
  { role: "FE 엔지니어", expected: "relevant" },
  { role: "웹 개발 (TypeScript)", expected: "relevant" },
  { role: "백엔드 개발자", text: "React, Next.js 경험 우대", expected: "relevant" }, // 본문 신호
  // 약한 신호 → 확인 필요
  { role: "백엔드 개발자", expected: "review" },
  { role: "개발자", expected: "review" },
  { role: "소프트웨어 엔지니어", expected: "review" },
  { role: "앱 개발자", expected: "review" },
  // 블랙리스트 / 무신호 → 제외
  { role: "마케팅 매니저", expected: "irrelevant" },
  { role: "React 기반 고객센터 상담 시스템 운영", expected: "irrelevant" }, // 블랙리스트 우선
  { role: "품질관리 QA", expected: "irrelevant" },
  { role: "생산직 사원", expected: "irrelevant" },
  { role: "즐겨찾기 / [교육/서면역] 인바운드센터 채용", expected: "irrelevant" },
  { role: "cafe 매니저", expected: "irrelevant" }, // "fe" 토큰 오탐 방지
  { role: "데이터 분석가", expected: "irrelevant" }
];

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

let pass = 0;
for (const item of cases) {
  const actual = classifyRole(item.role, item.text);
  assert(
    actual === item.expected,
    `"${item.role}"${item.text ? ` (+본문)` : ""}: expected ${item.expected}, actual ${actual}`
  );
  pass += 1;
  console.log(`✓ ${item.role} → ${actual}`);
}

// isRelevantRole 호환: review/relevant 는 true, irrelevant 는 false
assert(isRelevantRole("백엔드 개발자") === true, "isRelevantRole review→true");
assert(isRelevantRole("마케팅 매니저") === false, "isRelevantRole irrelevant→false");

console.log(`\n✅ T37 role-filter 검증 완료 (${pass}/${cases.length})`);
