import { redirect } from "next/navigation";

import { getUser } from "@/entities/session";
import { LoginForm, requestMagicLink } from "@/features/auth";
import { Card } from "@/shared/ui/card";
import { css } from "../../styled-system/css";

type LoginPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getUser();
  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const errorMessage = params?.error
    ? decodeURIComponent(params.error)
    : undefined;

  return (
    <main
      className={css({
        bg: "bg",
        minH: "100dvh",
        px: { base: 4, md: 6 },
        py: 12
      })}
    >
      <section
        className={css({
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxW: "28rem",
          minH: "calc(100dvh - 6rem)",
          mx: "auto"
        })}
      >
        <Card className={css({ p: 6 })}>
          <p className={css({ color: "textMuted", fontWeight: 500, textStyle: "sm" })}>로그인</p>
          <h1 className={css({ mt: 2, textStyle: "2xl" })}>
            매직링크로 시작
          </h1>
          <p className={css({ color: "textMuted", mt: 3, textStyle: "sm" })}>
            가입된 이메일로 받은 링크를 열면 대시보드에 접속합니다.
          </p>
          <div className={css({ mt: 6 })}>
            <LoginForm
              errorMessage={errorMessage}
              requestAction={requestMagicLink}
            />
          </div>
        </Card>
      </section>
    </main>
  );
}
