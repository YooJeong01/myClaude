/**
 * 수집된 공고를 Supabase에 삽입하는 로직.
 *
 * sync-dart-corp-codes.ts와 동일한 배치 처리 패턴.
 * upsert + ignoreDuplicates 로 중복 실행을 안전하게 처리한다.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/supabase/types';
import type { CollectedJobPosting, InsertResult, JobPostingSource } from './types';

const BATCH_SIZE = 100;

export async function insertCollectedJobPostings(
  admin: SupabaseClient<Database>,
  userId: string,
  postings: CollectedJobPosting[],
  source: JobPostingSource
): Promise<InsertResult> {
  let inserted = 0;
  let skipped = 0;

  // 입력값 검증: url 또는 rawText 중 하나는 필수
  const validated = postings.filter((p) => p.url || p.rawText);
  if (validated.length < postings.length) {
    console.warn(`  ⚠ url/rawText 둘 다 없는 공고 ${postings.length - validated.length}건 스킵`);
  }

  // 배치 처리
  for (let i = 0; i < validated.length; i += BATCH_SIZE) {
    const batch = validated.slice(i, i + BATCH_SIZE).map((p) => {
      // 날짜 파싱: 유효하지 않은 형식은 null로 처리
      const parseDate = (dateStr?: string | Date): string | null => {
        if (!dateStr) return null;
        try {
          return new Date(dateStr).toISOString().split('T')[0];
        } catch {
          console.warn(`  ⚠ 날짜 파싱 실패: "${dateStr}"`);
          return null;
        }
      };

      return {
        user_id: userId,
        company_name_raw: p.companyNameRaw,
        role: p.role,
        employment_type: p.employmentType,
        posted_at: parseDate(p.postedAt),
        deadline: parseDate(p.deadline),
        url: p.url || null,
        raw_text: p.rawText || null,
        source
      };
    });

    const { error, data } = await admin
      .from('job_postings')
      .upsert(batch, {
        onConflict: 'user_id,company_key,role_norm,employment_type,posted_at',
        ignoreDuplicates: true
      })
      .select('id');

    if (error) {
      console.error(`배치 ${Math.floor(i / BATCH_SIZE) + 1} upsert 실패:`, error);
      throw error;
    }

    // ignoreDuplicates: true 이면 중복 행은 응답에 포함되지 않으므로
    // 삽입된 행 개수는 returned data 길이
    const batchInserted = data?.length ?? 0;
    inserted += batchInserted;
    skipped += batch.length - batchInserted;

    console.log(`  ✓ 배치 ${Math.floor(i / BATCH_SIZE) + 1}: ${batchInserted} 삽입, ${batch.length - batchInserted} 중복 스킵`);
  }

  return { inserted, skipped };
}
