import type { DartCompanyProfile, DartKeyFinancials } from "../dart/types";

export type CompanySizeEstimate = {
  label: "대기업" | "중견기업" | "중소기업" | "스타트업" | "미상";
  basis: string;
  confidence: "낮음" | "중간";
};

const EOK = 100_000_000;
const LARGE_REVENUE = 20_000 * EOK;
const MID_REVENUE = 1_000 * EOK;
const SMALL_REVENUE = 400 * EOK;

export function estimateCompanySize(
  profile: DartCompanyProfile,
  financials: DartKeyFinancials | null
): CompanySizeEstimate {
  const revenue = financials?.revenue ?? null;
  const totalAssets = financials?.totalAssets ?? null;
  const age = companyAge(profile.establishedDate);
  const listed = profile.corpClass === "Y" || profile.corpClass === "K";

  if (profile.corpClass === "Y" && revenue !== null && revenue >= LARGE_REVENUE) {
    return {
      label: "대기업",
      basis: `유가증권 상장, 매출 ${formatEok(revenue)} 기준`,
      confidence: "중간"
    };
  }

  if (listed && revenue !== null && revenue >= MID_REVENUE) {
    return {
      label: "중견기업",
      basis: `상장사, 매출 ${formatEok(revenue)} 기준`,
      confidence: "중간"
    };
  }

  if (listed || profile.corpClass === "N") {
    if (revenue !== null && revenue < SMALL_REVENUE && age !== null && age < 7) {
      return {
        label: "스타트업",
        basis: `상장/등록 기업, 매출 ${formatEok(revenue)}, 업력 ${age}년 기준`,
        confidence: "낮음"
      };
    }
    if (revenue !== null || totalAssets !== null) {
      return {
        label: "중소기업",
        basis: `상장/등록 기업, 매출 ${formatNullableEok(revenue)}, 자산 ${formatNullableEok(totalAssets)} 기준`,
        confidence: "낮음"
      };
    }
    return {
      label: "미상",
      basis: "상장/등록 여부 외 재무 기준 자료 없음",
      confidence: "낮음"
    };
  }

  if (!financials && age !== null && age < 7) {
    return {
      label: "스타트업",
      basis: `비상장, 재무 자료 없음, 업력 ${age}년 기준`,
      confidence: "낮음"
    };
  }

  if (!financials && age !== null && age >= 7) {
    return {
      label: "미상",
      basis: `비상장, 재무 자료 없음, 업력 ${age}년 기준`,
      confidence: "낮음"
    };
  }

  return {
    label: "미상",
    basis: "기업 규모를 추정할 공개 재무/업력 자료 부족",
    confidence: "낮음"
  };
}

function companyAge(establishedDate: string | null): number | null {
  if (!establishedDate) return null;
  const normalized = establishedDate.includes("-")
    ? establishedDate
    : establishedDate.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3");
  const established = new Date(normalized);
  if (Number.isNaN(established.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - established.getFullYear();
  const monthDelta = now.getMonth() - established.getMonth();
  if (
    monthDelta < 0 ||
    (monthDelta === 0 && now.getDate() < established.getDate())
  ) {
    age -= 1;
  }
  return Math.max(age, 0);
}

function formatEok(value: number): string {
  return `${Math.round(value / EOK).toLocaleString("ko-KR")}억 원`;
}

function formatNullableEok(value: number | null): string {
  return value === null ? "자료 없음" : formatEok(value);
}
