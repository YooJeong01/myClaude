import type { Metadata } from "next";
import { Providers } from "@/app/providers";
import "pretendard/dist/web/variable/pretendardvariable.css";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "myClaude",
  description: "Company research workflow scaffold"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();"
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
