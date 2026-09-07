/**
 * DB 스키마 계약 (canonical).
 *
 * `supabase/migrations/` 의 SQL 과 수기로 동기화한다. Supabase CLI 를 도입하지 않으므로
 * 마이그레이션을 추가할 때마다 이 파일을 함께 고친다.
 *
 * 규칙:
 *   - generated 컬럼(role_norm, company_key)은 Row 에만 존재하고 Insert/Update 에서 제외.
 *   - 기본값이 있는 컬럼은 Insert 에서 optional.
 *   - nullable 컬럼은 Row 에서 `| null`.
 *   - 빈 네임스페이스(Views/Functions/Enums/CompositeTypes)는 `{ [_ in never]: never }` 로 둔다.
 *     `Record<string, never>` 는 인덱스 시그니처가 생겨 supabase-js 의 `from()` 이 View 오버로드로
 *     해석되고 반환 타입이 `{}` 로 무너진다. 이 shape 은 `supabase gen types typescript
 *     --project-id <id> --schema public` 출력과 동일하다 — 스키마 변경 시 그 명령으로 재생성해
 *     이 파일을 대체하면 된다.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          id: string;
          corp_code: string;
          name: string;
          stock_code: string | null;
          industry: string | null;
          public_data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          corp_code: string;
          name: string;
          stock_code?: string | null;
          industry?: string | null;
          public_data?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          corp_code?: string;
          name?: string;
          stock_code?: string | null;
          industry?: string | null;
          public_data?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      job_postings: {
        Row: {
          id: string;
          user_id: string;
          company_id: string | null;
          company_name_raw: string | null;
          company_key: string;
          role: string;
          role_norm: string;
          employment_type: string;
          posted_at: string | null;
          deadline: string | null;
          source: string;
          url: string | null;
          raw_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id?: string | null;
          company_name_raw?: string | null;
          role: string;
          employment_type?: string;
          posted_at?: string | null;
          deadline?: string | null;
          source?: string;
          url?: string | null;
          raw_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string | null;
          company_name_raw?: string | null;
          role?: string;
          employment_type?: string;
          posted_at?: string | null;
          deadline?: string | null;
          source?: string;
          url?: string | null;
          raw_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "job_postings_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
      };
      dart_corp_codes: {
        Row: {
          corp_code: string;
          corp_name: string;
          corp_eng_name: string | null;
          stock_code: string | null;
          modify_date: string | null;
          synced_at: string;
        };
        Insert: {
          corp_code: string;
          corp_name: string;
          corp_eng_name?: string | null;
          stock_code?: string | null;
          modify_date?: string | null;
          synced_at?: string;
        };
        Update: {
          corp_code?: string;
          corp_name?: string;
          corp_eng_name?: string | null;
          stock_code?: string | null;
          modify_date?: string | null;
          synced_at?: string;
        };
        Relationships: [];
      };
      company_analyses: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          role: string;
          role_norm: string;
          job_posting_id: string | null;
          result: Json;
          sources: Json;
          model: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id: string;
          role: string;
          job_posting_id?: string | null;
          result: Json;
          sources?: Json;
          model?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string;
          role?: string;
          job_posting_id?: string | null;
          result?: Json;
          sources?: Json;
          model?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_analyses_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_analyses_job_posting_id_fkey";
            columns: ["job_posting_id"];
            isOneToOne: false;
            referencedRelation: "job_postings";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
