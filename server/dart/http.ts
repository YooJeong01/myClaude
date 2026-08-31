import { DART_BASE_URL, getDartApiKey } from "./config";
import { DartApiError } from "./types";

/** DART status 코드 → DartApiError. */
export function mapDartStatus(
  status: string | undefined,
  message: string | undefined
): DartApiError {
  const msg = message ?? "DART 오류";
  switch (status) {
    case "020":
      return new DartApiError("RATE_LIMITED", msg, status);
    case "100":
    case "101":
      return new DartApiError("INVALID_KEY", msg, status);
    case "013":
      return new DartApiError("NO_DATA", msg, status);
    default:
      return new DartApiError("DART_ERROR", `${msg} (status ${status ?? "?"})`, status);
  }
}

interface DartEnvelope {
  status?: string;
  message?: string;
}

/**
 * DART JSON 엔드포인트 GET. `crtfc_key` 는 자동 주입.
 * status 가 "000" 이 아니면 DartApiError 를 던진다.
 */
export async function dartGet<T>(
  path: string,
  params: Record<string, string>
): Promise<T & DartEnvelope> {
  const query = new URLSearchParams({ crtfc_key: getDartApiKey(), ...params });
  const res = await fetch(`${DART_BASE_URL}/${path}?${query.toString()}`);

  if (!res.ok) {
    throw new DartApiError("HTTP_ERROR", `DART ${path} 실패: HTTP ${res.status}`);
  }

  const body = (await res.json()) as T & DartEnvelope;
  if (body.status && body.status !== "000") {
    throw mapDartStatus(body.status, body.message);
  }
  return body;
}
