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
  title: "feedback4U",
  description: "AI 빌더를 위한 피드백 수집 및 검증 운영 플랫폼"
};

export const preferredRegion = "icn1";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${manrope.variable} ${notoSansKr.variable}`}>
        <AuthSessionProvider session={null}>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
