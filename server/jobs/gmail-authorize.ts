/**
 * Gmail OAuth 1회성 인가 스크립트.
 *
 * 처음 한 번만 실행해서 refresh_token을 획득한다.
 * 7일 주기로 재실행 가능 (Testing 모드에서 토큰이 만료되므로).
 *
 * 실행:
 *   1. pnpm exec tsx --env-file=.env.local server/jobs/gmail-authorize.ts
 *   2. 콘솔에 나오는 URL을 브라우저에서 열기
 *   3. 계정 동의 후 인가 코드 복사
 *   4. 콘솔에 코드 붙여넣기
 *   5. refresh_token 출력됨 → .env.local + GitHub Secrets에 저장
 *
 * ⚠️ 보안:
 * - 이 스크립트는 절대 자동화하지 말 것 (사용자 동의가 필수).
 * - 콘솔에서 출력되는 refresh_token을 안전하게 보관할 것.
 */
import { google } from 'googleapis';
import * as readline from 'readline';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

function getCredentials() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const redirectUri = process.env.GMAIL_REDIRECT_URI ?? 'http://localhost';

  if (!clientId || !clientSecret) {
    throw new Error(
      '❌ GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET이 설정되지 않았습니다.\n' +
        'GCP에서 OAuth 클라이언트를 생성한 뒤 .env.local에 추가하세요.'
    );
  }

  return { clientId, clientSecret, redirectUri };
}

async function authorize(): Promise<void> {
  const { clientId, clientSecret, redirectUri } = getCredentials();

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  // 인가 URL 생성
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });

  console.log('🔐 Gmail OAuth 인가\n');
  console.log('1️⃣  아래 URL을 브라우저에서 열기:');
  console.log(`   ${authUrl}\n`);

  console.log('2️⃣  계정 동의 후 리다이렉트되는 URL의 "code=..." 부분 복사\n');

  // 콘솔에서 코드 입력받기
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve, reject) => {
    rl.question('인가 코드 입력 (또는 Ctrl+C 취소): ', async (code) => {
      rl.close();

      if (!code) {
        console.log('❌ 코드가 입력되지 않았습니다.');
        reject(new Error('Cancelled'));
        return;
      }

      try {
        console.log('\n3️⃣  토큰 교환 중...\n');

        const { tokens } = await oauth2Client.getToken(code);

        console.log('✅ 성공! 다음 정보를 저장하세요:\n');
        console.log('📝 .env.local 또는 GitHub Secrets:');
        console.log(`GMAIL_CLIENT_ID=${clientId}`);
        console.log(`GMAIL_CLIENT_SECRET=${clientSecret}`);
        console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}\n`);

        console.log('⚠️  refresh_token 유효 기간:');
        console.log('   Testing 모드에서는 7일 후 만료됩니다.');
        console.log('   그 이후 이 스크립트를 다시 실행해서 토큰을 갱신하세요.\n');

        console.log('🎉 이제 collect-email-postings.ts를 실행할 준비가 완료됐습니다!');

        resolve();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`❌ 토큰 교환 실패: ${msg}`);
        reject(err);
      }
    });
  });
}

authorize().catch((error) => {
  console.error('오류:', error.message);
  process.exit(1);
});
