import type { Metadata } from "next";
import { Manrope, Noto_Sans_KR } from "next/font/google";
import AuthSessionProvider from "@/components/providers/AuthSessionProvider";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
});

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-noto-sans-kr"
});

export const metadata: Metadata = {
  title: "MVP Showcase Hub",
  description: "MVP를 등록하고, 실사용 반응을 분석하며, 프로젝트를 운영하는 데모 서비스"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${manrope.variable} ${notoSansKr.variable}`}>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
