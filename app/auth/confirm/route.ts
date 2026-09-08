import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/shared/api-server";

const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email"
]);

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const code = requestUrl.searchParams.get("code");
  const supabase = await createSupabaseServerClient();

  if (tokenHash && type && isEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type
    });

    if (!error) {
      return NextResponse.redirect(new URL("/dashboard", requestUrl));
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL("/dashboard", requestUrl));
    }
  }

  return NextResponse.redirect(
    new URL(
      `/login?error=${encodeURIComponent("로그인 링크가 만료되었거나 유효하지 않습니다.")}`,
      requestUrl
    )
  );
}

function isEmailOtpType(type: string): type is EmailOtpType {
  return EMAIL_OTP_TYPES.has(type as EmailOtpType);
}
