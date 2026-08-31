import { dartGet } from "./http";
import {
  DartApiError,
  type DartCompanyProfile,
  type DartFinancialRow,
  type DartKeyFinancials
} from "./types";

/** company.json — 기업개황. */
export async function fetchCompanyProfile(corpCode: string): Promise<DartCompanyProfile> {
  const body = await dartGet<Record<string, string>>("company.json", { corp_code: corpCode });
  return {
    corpCode: body.corp_code ?? corpCode,
    corpName: body.corp_name ?? "",
    corpNameEng: nullable(body.corp_name_eng),
    stockName: nullable(body.stock_name),
    stockCode: nullable(body.stock_code),
    ceoName: nullable(body.ceo_nm),
    corpClass: nullable(body.corp_cls),
    industryCode: nullable(body.induty_code),
    establishedDate: isoDate(body.est_dt),
    accountMonth: nullable(body.acc_mt),
    homepageUrl: nullable(body.hm_url),
    address: nullable(body.adres)
  };
}

const ANNUAL_REPORT_CODE = "11011";

/** 최근 사업연도 주요 재무. year 미지정 시 (올해-1) → 무자료면 (올해-2) 로 1회 폴백. */
export async function fetchKeyFinancials(
  corpCode: string,
  opts: { year?: number; reprtCode?: string } = {}
): Promise<DartKeyFinancials> {
  const reprtCode = opts.reprtCode ?? ANNUAL_REPORT_CODE;
  const startYear = opts.year ?? new Date().getFullYear() - 1;

  for (let year = startYear; year >= startYear - 1; year--) {
    try {
      const rows = await fetchAccountRows(corpCode, String(year), reprtCode);
      return summarize(rows, String(year), reprtCode);
    } catch (err) {
      if (err instanceof DartApiError && err.code === "NO_DATA" && opts.year === undefined) {
        continue; // 자동 폴백
      }
      throw err;
    }
  }
  throw new DartApiError(
    "NO_DATA",
    `${startYear}~${startYear - 1} 사업연도 재무 데이터가 없습니다.`,
    "013"
  );
}

async function fetchAccountRows(
  corpCode: string,
  bsnsYear: string,
  reprtCode: string
): Promise<DartFinancialRow[]> {
  const body = await dartGet<{ list?: DartFinancialRow[] }>("fnlttSinglAcnt.json", {
    corp_code: corpCode,
    bsns_year: bsnsYear,
    reprt_code: reprtCode
  });
  return body.list ?? [];
}

/** 연결(CFS) 우선, 없으면 개별(OFS). 계정명 매칭으로 6개 항목 추출. */
function summarize(
  rows: DartFinancialRow[],
  bsnsYear: string,
  reprtCode: string
): DartKeyFinancials {
  const fsDiv: "CFS" | "OFS" = rows.some((r) => r.fs_div === "CFS") ? "CFS" : "OFS";
  const scoped = rows.filter((r) => r.fs_div === fsDiv);

  const pick = (matchers: RegExp[]): number | null => {
    const row = scoped.find((r) => {
      const name = normalizeAccountName(r.account_nm);
      return matchers.some((re) => re.test(name));
    });
    return row ? parseAmount(row.thstrm_amount) : null;
  };

  return {
    bsnsYear,
    reprtCode,
    fsDiv,
    revenue: pick([/^매출액$/, /^수익매출액$/, /^영업수익$/, /^매출$/]),
    operatingProfit: pick([/^영업이익$/, /^영업이익손실$/]),
    netIncome: pick([/^당기순이익$/, /^당기순이익손실$/, /^분기순이익$/, /^반기순이익$/]),
    totalAssets: pick([/^자산총계$/]),
    totalLiabilities: pick([/^부채총계$/]),
    totalEquity: pick([/^자본총계$/])
  };
}

function normalizeAccountName(name: string): string {
  return name.replace(/[\s()[\]]/g, "");
}

function parseAmount(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/,/g, "").trim();
  if (cleaned === "" || cleaned === "-") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function nullable(value: string | undefined): string | null {
  const s = (value ?? "").trim();
  return s.length > 0 ? s : null;
}

/** "19690113" → "1969-01-13" */
function isoDate(value: string | undefined): string | null {
  const s = (value ?? "").trim();
  if (!/^\d{8}$/.test(s)) return null;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}
