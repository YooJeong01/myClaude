import { redirect } from "next/navigation";

import { getUser } from "@/entities/session";
import { LoginForm, requestMagicLink } from "@/features/auth";

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
    <main className="min-h-screen bg-background px-6 py-12">
      <section className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-md flex-col justify-center">
        <div className="rounded-md border bg-card p-6 text-card-foreground">
          <p className="text-sm font-medium text-muted-foreground">로그인</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal">
            매직링크로 시작
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            가입된 이메일로 받은 링크를 열면 대시보드에 접속합니다.
          </p>
          <div className="mt-6">
            <LoginForm
              errorMessage={errorMessage}
              requestAction={requestMagicLink}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
