import { isRelevantRole } from "../scraping/common/role-filter";

type Case = {
  role: string;
  title?: string;
  expected: boolean;
};

const cases: Case[] = [
  { role: "프론트엔드 개발자", expected: true },
  { role: "React 웹 개발", expected: true },
  { role: "웹 퍼블리셔", expected: true },
  { role: "풀스택 엔지니어", expected: true },
  { role: "백엔드 개발자", expected: false },
  { role: "마케팅 매니저", expected: false },
  { role: "React 기반 고객센터 상담 시스템 운영", expected: false },
  { role: "품질관리 QA", expected: false }
];

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

for (const item of cases) {
  const actual = isRelevantRole(item.role, item.title);
  assert(
    actual === item.expected,
    `${item.role}: expected ${item.expected}, actual ${actual}`
  );
  console.log(`✓ ${item.role} → ${actual}`);
}

console.log("\n✅ T37 role-filter 검증 완료");
