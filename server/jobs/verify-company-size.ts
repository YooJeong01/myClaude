import { estimateCompanySize } from "../analysis/company-size";
import type { DartCompanyProfile, DartKeyFinancials } from "../dart/types";

type Case = {
  name: string;
  profile: DartCompanyProfile;
  financials: DartKeyFinancials | null;
  expected: ReturnType<typeof estimateCompanySize>["label"];
};

const baseProfile: DartCompanyProfile = {
  corpCode: "00000000",
  corpName: "검증회사",
  corpNameEng: null,
  stockName: null,
  stockCode: null,
  ceoName: null,
  corpClass: null,
  industryCode: null,
  establishedDate: "2020-01-01",
  accountMonth: null,
  homepageUrl: null,
  address: null
};

const baseFinancials: DartKeyFinancials = {
  bsnsYear: "2025",
  reprtCode: "11011",
  fsDiv: "CFS",
  revenue: null,
  operatingProfit: null,
  netIncome: null,
  totalAssets: null,
  totalLiabilities: null,
  totalEquity: null
};

const EOK = 100_000_000;

const cases: Case[] = [
  {
    name: "유가증권 2조 이상",
    profile: { ...baseProfile, corpClass: "Y" },
    financials: { ...baseFinancials, revenue: 25_000 * EOK },
    expected: "대기업"
  },
  {
    name: "코스닥 1000억 이상",
    profile: { ...baseProfile, corpClass: "K" },
    financials: { ...baseFinancials, revenue: 1_500 * EOK },
    expected: "중견기업"
  },
  {
    name: "신생 상장 소규모 매출",
    profile: { ...baseProfile, corpClass: "K", establishedDate: "2023-01-01" },
    financials: { ...baseFinancials, revenue: 120 * EOK },
    expected: "스타트업"
  },
  {
    name: "비상장 재무 없음 7년 이상",
    profile: { ...baseProfile, corpClass: "E", establishedDate: "2010-01-01" },
    financials: null,
    expected: "미상"
  }
];

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

for (const item of cases) {
  const actual = estimateCompanySize(item.profile, item.financials);
  assert(
    actual.label === item.expected,
    `${item.name}: expected ${item.expected}, actual ${actual.label}`
  );
  console.log(`✓ ${item.name} → ${actual.label} (${actual.basis})`);
}

console.log("\n✅ T41 company-size 검증 완료");
