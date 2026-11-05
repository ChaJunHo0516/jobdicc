import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PreBridge",
  description: "기업별 AI 프리온보딩·직무교육·채용 통합 플랫폼",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
