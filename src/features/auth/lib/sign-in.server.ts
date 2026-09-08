"use server";

import { headers } from "next/headers";

import { createSupabaseServerClient } from "@/shared/api-server";

export async function requestMagicLink(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return { success: false, error: "이메일을 입력하세요." };
  }

  const headerStore = await headers();
  const origin =
    headerStore.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`
    }
  });

  if (error) {
    console.error("[requestMagicLink]", error);
    return { success: false, error: "로그인 링크 발송에 실패했습니다." };
  }

  return { success: true };
}
