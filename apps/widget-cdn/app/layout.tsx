import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "embed_test",
  description: "mvp_final과 분리 배포되는 widget.js 전용 런타임 프로젝트"
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
