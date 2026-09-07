import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../supabase/types";

import { DartApiError, type DartCorpEntry } from "./types";

type Admin = SupabaseClient<Database>;
type CorpRow = Database["public"]["Tables"]["dart_corp_codes"]["Row"];

export interface ResolveResult {
  /** 확정된 회사. 후보가 여럿이면 상장사 우선으로 고른 것. */
  match: DartCorpEntry | null;
  /** 이름이 여러 회사와 겹칠 때 전체 후보 (match 포함). */
  candidates: DartCorpEntry[];
}

/**
 * 회사명 또는 8자리 corp_code 를 DartCorpEntry 로 해석한다.
 * dart_corp_codes 테이블(동기화 잡이 채움)을 조회한다.
 */
export async function resolveCorp(admin: Admin, nameOrCode: string): Promise<ResolveResult> {
  const query = nameOrCode.trim();
  if (!query) {
    return { match: null, candidates: [] };
  }

  await assertTablePopulated(admin);

  const isCorpCode = /^\d{8}$/.test(query);
  const column = isCorpCode ? "corp_code" : "corp_name";
  const { data, error } = await admin
    .from("dart_corp_codes")
    .select("*")
    .eq(column, query);

  if (error) {
    throw new DartApiError("DART_ERROR", `dart_corp_codes 조회 실패: ${error.message}`);
  }

  const candidates = (data ?? []).map(rowToEntry);
  if (candidates.length === 0) {
    return { match: null, candidates: [] };
  }

  // 상장사(stock_code 존재) 우선, 그 안에서는 corp_code 오름차순.
  const sorted = [...candidates].sort((a, b) => {
    const listed = Number(Boolean(b.stockCode)) - Number(Boolean(a.stockCode));
    return listed !== 0 ? listed : a.corpCode.localeCompare(b.corpCode);
  });

  return { match: sorted[0], candidates: sorted };
}

async function assertTablePopulated(admin: Admin): Promise<void> {
  const { count, error } = await admin
    .from("dart_corp_codes")
    .select("corp_code", { count: "exact", head: true });

  if (error) {
    throw new DartApiError("DART_ERROR", `dart_corp_codes 조회 실패: ${error.message}`);
  }
  if (!count) {
    throw new DartApiError(
      "NO_DATA",
      "dart_corp_codes 테이블이 비어 있습니다. server/jobs/sync-dart-corp-codes.ts 를 먼저 실행하세요."
    );
  }
}

function rowToEntry(row: CorpRow): DartCorpEntry {
  return {
    corpCode: row.corp_code,
    corpName: row.corp_name,
    corpEngName: row.corp_eng_name,
    stockCode: row.stock_code,
    modifyDate: row.modify_date
  };
}
