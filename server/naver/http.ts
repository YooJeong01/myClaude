/**
 * 네이버 검색 API HTTP 요청 래퍼.
 *
 * server/dart/http.ts와 동일한 패턴.
 * NAVER API HUB(NCP) 인증 헤더(X-NCP-APIGW-API-KEY-ID/KEY)를 자동으로 추가.
 */
import { getNaverConfig, NAVER_SEARCH_BASE_URL } from './config';

export class NaverApiError extends Error {
  readonly code: string;
  readonly httpStatus: number;

  constructor(code: string, httpStatus: number, message: string) {
    super(message);
    this.name = 'NaverApiError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export async function naverGet<T>(path: string, searchParams: Record<string, string | number>): Promise<T> {
  const { clientId, clientSecret } = getNaverConfig();

  const url = new URL(path, NAVER_SEARCH_BASE_URL);
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'X-NCP-APIGW-API-KEY-ID': clientId,
      'X-NCP-APIGW-API-KEY': clientSecret,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorCode = `HTTP_${response.status}`;
    try {
      const parsed = JSON.parse(errorBody);
      errorCode = parsed.errorCode ?? errorCode;
    } catch {
      // JSON 파싱 실패, errorCode는 HTTP 상태 코드로 사용
    }

    throw new NaverApiError(
      errorCode,
      response.status,
      `네이버 API 오류 (${response.status}): ${errorBody || response.statusText}`
    );
  }

  const data: T = await response.json();
  return data;
}
