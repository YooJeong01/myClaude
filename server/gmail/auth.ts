/**
 * Gmail OAuth2 클라이언트 생성 및 토큰 관리.
 *
 * googleapis 라이브러리의 OAuth2Client를 사용해서
 * refresh_token으로 자동 access_token 갱신을 처리한다.
 */
import { google } from 'googleapis';
import type { gmail_v1 } from 'googleapis';
import { getGmailConfig } from './config';

export function createGmailClient(): gmail_v1.Gmail {
  const { clientId, clientSecret, refreshToken, redirectUri } = getGmailConfig();

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  // refresh_token 설정
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  // (옵션) 토큰 갱신 이벤트 감시
  // 실제 갱신된 access_token을 DB에 저장하려면 여기서 처리.
  // 그러나 본 프로젝트는 refresh_token만 저장하고 라이브러리에 자동 갱신 위임.
  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      console.log(`  ℹ️ refresh_token 갱신됨 (7일 주기)`);
      // 여기서 DB/환경변수 업데이트 가능
    }
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}
