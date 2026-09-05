/**
 * Gmail API OAuth 설정.
 *
 * ⚠️ 중요: Testing 모드 제약사항
 * - Restricted scope(`gmail.readonly`)를 Testing 모드에서 사용하면 refresh_token이 7일 후 만료됨.
 * - Production 전환은 Google 보안 심사 필요 (개인 프로젝트에는 부담).
 * - 따라서 이메일 수집이 "백업" 채널이라는 점을 감안해 Testing 모드 유지 + 7일마다 재인증 권장.
 *
 * 초기 설정 절차:
 * 1. GCP 프로젝트 생성 → Gmail API 활성화
 * 2. OAuth 동의 화면: External, Testing 모드, 스코프 gmail.readonly, 테스트 사용자 본인 등록
 * 3. OAuth 클라이언트: 데스크톱 앱 → client_id, client_secret 획득
 * 4. 사용자가 `gmail-authorize.ts` 실행 → 인가 URL에서 동의 → refresh_token 획득
 * 5. refresh_token을 `.env.local` + GitHub Secrets에 저장
 *
 * 토큰 갱신:
 * - 매 실행 시 googleapis 라이브러리가 자동으로 access_token 갱신.
 * - 7일마다 (또는 refresh_token 만료 시) `gmail-authorize.ts` 재실행.
 */

export function getGmailConfig() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret) {
    throw new Error(
      '❌ Gmail OAuth 클라이언트 자격증명 누락.\n' +
        '  1. GCP 프로젝트에서 Gmail API 활성화\n' +
        '  2. OAuth 클라이언트(데스크톱 앱) 생성\n' +
        '  3. GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET을 .env.local에 저장\n' +
        '  4. server/jobs/gmail-authorize.ts 실행해 refresh_token 획득'
    );
  }

  if (!refreshToken) {
    throw new Error(
      '❌ GMAIL_REFRESH_TOKEN 미설정.\n' +
        '  server/jobs/gmail-authorize.ts를 실행해 토큰을 획득한 뒤\n' +
        '  .env.local과 GitHub Secrets에 저장하세요.'
    );
  }

  return {
    clientId,
    clientSecret,
    refreshToken,
    redirectUri: process.env.GMAIL_REDIRECT_URI ?? 'http://localhost'
  };
}

/**
 * 찾을 이메일 발신자 (사람인/잡코리아 알림).
 * 실제 이메일 주소로 갱신 필요.
 */
export const ALERT_EMAIL_SENDERS = [
  'no-reply@saramin.co.kr',
  'noreply@jobkorea.co.kr',
  'catch@email.catch.co.kr'
];

/**
 * 검색 쿼리 (Gmail 검색 문법).
 * 알림 이메일이면서 읽지 않은 메일을 찾음.
 */
export const GMAIL_SEARCH_QUERY = `is:unread from:(${ALERT_EMAIL_SENDERS.join(' OR ')})`;

/**
 * 메일함 라벨. 기본값 "INBOX".
 */
export const GMAIL_LABEL = 'INBOX';
