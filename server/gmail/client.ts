/**
 * Gmail API 호출 래퍼.
 *
 * 최근 알림 이메일을 찾고, 본문을 가져온다.
 */
import type { gmail_v1 } from 'googleapis';
import { GMAIL_SEARCH_QUERY, GMAIL_LABEL } from './config';

export interface EmailMessage {
  id: string;
  snippet: string;
}

export interface EmailBody {
  id: string;
  html: string | null;
  text: string | null;
}

/**
 * 알림 이메일 메시지 목록 조회.
 *
 * @param gmail Gmail API 클라이언트
 * @param maxResults 최대 조회 건수 (기본 10)
 * @returns 메시지 ID와 스니펫
 */
export async function listRecentAlertEmails(
  gmail: gmail_v1.Gmail,
  maxResults: number = 10
): Promise<EmailMessage[]> {
  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: GMAIL_SEARCH_QUERY,
      maxResults,
      labelIds: [GMAIL_LABEL]
    });

    const messages = response.data.messages ?? [];
    return messages.map((m) => ({
      id: m.id ?? '',
      snippet: m.snippet ?? ''
    }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Gmail 메시지 목록 조회 실패: ${msg}`);
  }
}

/**
 * 이메일 본문 가져오기.
 *
 * @param gmail Gmail API 클라이언트
 * @param messageId 메시지 ID
 * @returns HTML/텍스트 형식 본문
 */
export async function getMessageBody(
  gmail: gmail_v1.Gmail,
  messageId: string
): Promise<EmailBody> {
  try {
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    const message = response.data;
    // const headers = message.payload?.headers ?? [];
    // const subject = headers.find((h) => h.name === 'Subject')?.value ?? '';

    let htmlBody: string | null = null;
    let textBody: string | null = null;

    // 멀티파트 메시지 처리 (HTML + 텍스트)
    if (message.payload?.parts) {
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.mimeType === 'text/plain' && part.body?.data) {
          textBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
    } else if (message.payload?.body?.data) {
      // 단순 텍스트 메시지
      const mimeType = message.payload.mimeType ?? 'text/plain';
      const body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
      if (mimeType === 'text/html') {
        htmlBody = body;
      } else {
        textBody = body;
      }
    }

    return {
      id: messageId,
      html: htmlBody,
      text: textBody
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`메시지 본문 조회 실패 (${messageId}): ${msg}`);
  }
}

/**
 * 메시지를 읽음 처리 (라벨 제거: UNREAD).
 *
 * @param gmail Gmail API 클라이언트
 * @param messageId 메시지 ID
 */
export async function markMessageAsRead(
  gmail: gmail_v1.Gmail,
  messageId: string
): Promise<void> {
  try {
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD']
      }
    });
  } catch (err) {
    // 읽음 처리 실패는 non-critical, 경고만 하고 계속 진행
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`  ⚠ 메시지 읽음 처리 실패: ${msg}`);
  }
}
