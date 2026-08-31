import { unzipSync } from "fflate";
import { XMLParser } from "fast-xml-parser";

import { DART_BASE_URL, getDartApiKey } from "./config";
import { mapDartStatus } from "./http";
import { DartApiError, type DartCorpEntry } from "./types";

/**
 * DART 고유번호 전체 목록(corpCode.xml)을 내려받아 파싱한다.
 *
 * 응답은 CORPCODE.xml 하나가 든 ZIP(바이너리). 약 10만 개 기업.
 * 동기화 잡(server/jobs/sync-dart-corp-codes.ts)에서만 호출한다 —
 * Route Handler 는 dart_corp_codes 테이블을 조회한다.
 */
export async function downloadCorpCodeEntries(): Promise<DartCorpEntry[]> {
  const url = `${DART_BASE_URL}/corpCode.xml?crtfc_key=${getDartApiKey()}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new DartApiError("HTTP_ERROR", `corpCode.xml 다운로드 실패: HTTP ${res.status}`);
  }

  const buf = new Uint8Array(await res.arrayBuffer());

  // DART 는 에러 시 ZIP 대신 XML(<result><status>...）을 그대로 준다.
  if (looksLikeXml(buf)) {
    throw parseErrorXml(new TextDecoder().decode(buf));
  }

  const files = unzipSync(buf);
  const xmlBytes = files["CORPCODE.xml"] ?? Object.values(files)[0];
  if (!xmlBytes) {
    throw new DartApiError("DART_ERROR", "ZIP 안에서 CORPCODE.xml 을 찾지 못했습니다.");
  }

  const xml = new TextDecoder().decode(xmlBytes);
  const parser = new XMLParser({ isArray: (name) => name === "list" });
  const parsed = parser.parse(xml) as {
    result?: { status?: string; message?: string; list?: RawCorpEntry[] };
  };

  const status = parsed.result?.status;
  if (status && status !== "000") {
    throw mapDartStatus(status, parsed.result?.message);
  }

  const list = parsed.result?.list ?? [];
  return list.map(normalizeEntry);
}

interface RawCorpEntry {
  corp_code?: string | number;
  corp_name?: string | number;
  corp_eng_name?: string | number;
  stock_code?: string | number;
  modify_date?: string | number;
}

function normalizeEntry(raw: RawCorpEntry): DartCorpEntry {
  return {
    corpCode: String(raw.corp_code ?? "").trim().padStart(8, "0"),
    corpName: String(raw.corp_name ?? "").trim(),
    corpEngName: emptyToNull(raw.corp_eng_name),
    stockCode: emptyToNull(raw.stock_code),
    modifyDate: toIsoDate(raw.modify_date)
  };
}

function emptyToNull(value: string | number | undefined): string | null {
  const s = String(value ?? "").trim();
  return s.length > 0 ? s : null;
}

/** "20170630" → "2017-06-30" */
function toIsoDate(value: string | number | undefined): string | null {
  const s = String(value ?? "").trim();
  if (!/^\d{8}$/.test(s)) return null;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function looksLikeXml(buf: Uint8Array): boolean {
  // ZIP 은 'PK'(0x50 0x4b) 로 시작. 그 외면 XML 에러 응답으로 본다.
  return !(buf[0] === 0x50 && buf[1] === 0x4b);
}

function parseErrorXml(xml: string): DartApiError {
  const status = /<status>(.*?)<\/status>/.exec(xml)?.[1];
  const message = /<message>(.*?)<\/message>/.exec(xml)?.[1];
  return mapDartStatus(status, message);
}
