import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";

import { getUser } from "@/entities/session";
import { signOut } from "@/features/auth";
import { Button } from "@/shared/ui/button";
import { AppSidebar } from "@/widgets/app-shell";
import { css } from "../../styled-system/css";

export default async function AppLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div
      className={css({
        bg: "bg",
        color: "text",
        display: "flex",
        minH: "100dvh"
      })}
    >
      <AppSidebar
        email={user.email ?? "로그인 사용자"}
        logoutSlot={
          <form action={signOut}>
            <Button aria-label="로그아웃" size="icon" type="submit" variant="ghost">
              <LogOut aria-hidden="true" />
            </Button>
          </form>
        }
      />
      <main
        className={css({
          flex: 1,
          maxW: "container",
          minW: 0,
          mx: "auto",
          px: { base: 4, md: 8 },
          py: { base: 6, md: 8 },
          w: "full"
        })}
      >
        {children}
      </main>
    </div>
  );
}
