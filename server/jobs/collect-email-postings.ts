/**
 * Gmail 알림 이메일에서 채용공고를 추출하는 잡.
 *
 * 읽지 않은 알림 이메일을 찾아서 공고 정보를 파싱하고, Supabase에 저장한다.
 * GitHub Actions 스케줄(3시간마다) 또는 로컬 테스트용.
 *
 * 실행:
 *   pnpm exec tsx --env-file=.env.local server/jobs/collect-email-postings.ts
 *
 * 사전 조건:
 *   - server/jobs/gmail-authorize.ts를 먼저 실행해서 refresh_token 획득
 */
import { createAdminClient } from '../supabase/admin';
import { createGmailClient, listRecentAlertEmails, getMessageBody, markMessageAsRead } from '../gmail/client';
import { parseAlertEmail } from '../gmail/parse';
import { insertCollectedJobPostings } from '../job-postings/persist';

async function main(): Promise<void> {
  const userId = process.env.SCRAPE_OWNER_USER_ID;
  if (!userId) {
    throw new Error('❌ SCRAPE_OWNER_USER_ID 환경변수를 설정하세요.');
  }

  console.log('🚀 Gmail 알림 이메일 수집 시작\n');

  console.log('1️⃣  Supabase 연결');
  const admin = createAdminClient();
  console.log('  ✓ 연결됨\n');

  console.log('2️⃣  Gmail 클라이언트 초기화');
  let gmail;
  try {
    gmail = createGmailClient();
    console.log('  ✓ 초기화됨\n');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ 오류: ${msg}`);
    process.exit(1);
  }

  console.log('3️⃣  읽지 않은 알림 이메일 검색');
  let emails;
  try {
    emails = await listRecentAlertEmails(gmail, 20);
    console.log(`  ✓ ${emails.length}건 찾음\n`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ 오류: ${msg}`);
    process.exit(1);
  }

  if (emails.length === 0) {
    console.log('  → 처리할 새 이메일 없음. 종료.');
    return;
  }

  console.log('4️⃣  이메일 본문 파싱 및 공고 추출');
  const allPostings = [];
  for (const email of emails) {
    try {
      const body = await getMessageBody(gmail, email.id);
      const htmlContent = body.html || body.text || '';

      // 이메일 헤더에서 발신자 추출 (간단한 방법으로, 이메일 객체에서 직접 추출)
      // TODO: 실제로는 Message 객체에서 headers.From 파싱 필요
      // 여기서는 snippet에서 추정
      const senderGuess = email.snippet.includes('saramin')
        ? 'saramin'
        : email.snippet.includes('jobkorea')
          ? 'jobkorea'
          : 'catch';

      const postings = parseAlertEmail(`noreply@${senderGuess}.co.kr`, htmlContent);
      if (postings.length > 0) {
        console.log(`  📧 ${email.id.slice(0, 8)}... (${senderGuess}): ${postings.length}건 추출됨`);
        allPostings.push(...postings);
      }

      // 처리 완료 후 읽음 처리
      await markMessageAsRead(gmail, email.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ 이메일 처리 실패 (${email.id.slice(0, 8)}...): ${msg}`);
      // 개별 이메일 실패는 계속 진행
    }
  }

  console.log(`\n  총 ${allPostings.length}건 추출됨\n`);

  if (allPostings.length === 0) {
    console.log('⚠️  추출된 공고가 없음. 종료.');
    return;
  }

  console.log('5️⃣  DB에 저장');
  const { inserted, skipped } = await insertCollectedJobPostings(admin, userId, allPostings, 'email');

  console.log(`\n✅ 완료`);
  console.log(`  삽입: ${inserted}건`);
  console.log(`  중복 스킵: ${skipped}건`);
}

main().catch((error) => {
  console.error('❌ 오류:', error.message);
  process.exit(1);
});
