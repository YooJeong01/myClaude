import {
  classifyRole,
  isRelevantRole,
  type RoleRelevance
} from "../scraping/common/role-filter";

type Case = {
  role: string;
  text?: string;
  techStacks?: string[];
  expected: RoleRelevance;
};

const cases: Case[] = [
  // 확정 프론트엔드 → relevant (블랙리스트보다 우선)
  { role: "프론트엔드 개발자", expected: "relevant" },
  { role: "웹 퍼블리셔", expected: "relevant" },
  { role: "React 개발자", expected: "relevant" },
  { role: "풀스택 엔지니어", expected: "relevant" },
  { role: "풀스택 개발자 (백엔드 포함)", expected: "relevant" }, // 풀스택이 백엔드보다 우선
  { role: "FE 엔지니어", expected: "relevant" },
  { role: "웹 개발 (TypeScript)", expected: "relevant" },
  { role: "백엔드 개발자", text: "React, Next.js 경험 우대", expected: "relevant" }, // 본문 프론트엔드 신호 우선
  { role: "개발자", techStacks: ["Vue"], expected: "relevant" },
  { role: "개발자", techStacks: ["React", "TypeScript"], expected: "relevant" },
  // AI·데이터 계열 → review (사용자 관심)
  { role: "AI SW 엔지니어", expected: "review" },
  { role: "데이터 엔지니어", expected: "review" },
  { role: "Data Analyst / Data Engineer", expected: "review" },
  { role: "생성형 AI 애플리케이션 엔지니어", expected: "review" },
  { role: "데이터 분석가", expected: "review" },
  // 약한 신호 → 확인 필요
  { role: "개발자", expected: "review" },
  // 다른 개발 직군 → 제외 (사용자 범위 밖)
  { role: "백엔드 개발자", expected: "irrelevant" },
  { role: "Site Reliability Engineer", expected: "irrelevant" },
  { role: "안드로이드 개발자", expected: "irrelevant" },
  { role: "디지털 월렛 모바일 앱 개발", expected: "irrelevant" },
  { role: "K8S Cloud 운영 개발자", expected: "irrelevant" },
  { role: "Product Engineer (ERP)", expected: "irrelevant" },
  // 블랙리스트 / 무신호 → 제외
  { role: "마케팅 매니저", expected: "irrelevant" },
  { role: "React 기반 고객센터 상담 시스템 운영", expected: "irrelevant" }, // 고객센터/상담 블랙리스트 (react 는 확정FE 이지만 "react 기반"은 STRONG_FRONTEND 에 "react" 포함 → relevant?)
  { role: "품질관리 QA", expected: "irrelevant" },
  { role: "생산직 사원", expected: "irrelevant" },
  { role: "웹디자이너", expected: "review" }, // "웹" weak — 사용자가 개별 제외
  { role: "cafe 매니저", expected: "irrelevant" }
];

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

let pass = 0;
for (const item of cases) {
  const actual = classifyRole(item.role, item.text, item.techStacks);
  assert(
    actual === item.expected,
    `"${item.role}"${item.text ? ` (+본문)` : ""}${item.techStacks ? ` (+스택 ${item.techStacks.join(", ")})` : ""}: expected ${item.expected}, actual ${actual}`
  );
  pass += 1;
  console.log(`✓ ${item.role} → ${actual}`);
}

// isRelevantRole 호환: review/relevant 는 true, irrelevant 는 false
assert(isRelevantRole("개발자") === true, "isRelevantRole review→true");
assert(isRelevantRole("데이터 엔지니어") === true, "isRelevantRole review(AI)→true");
assert(isRelevantRole("백엔드 개발자") === false, "isRelevantRole other-dev→false");
assert(isRelevantRole("마케팅 매니저") === false, "isRelevantRole irrelevant→false");

console.log(`\n✅ T37 role-filter 검증 완료 (${pass}/${cases.length})`);
