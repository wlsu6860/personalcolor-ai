import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Serif_KR, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

const notoSans = Noto_Sans_KR({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const notoSerif = Noto_Serif_KR({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Color Fit — 컬러핏 | AI 퍼스널컬러 진단",
  description:
    "사진 한 장으로 받아보는 AI 퍼스널컬러 분석. 웜톤·쿨톤부터 12가지 세부 시즌 타입까지.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${notoSans.variable} ${notoSerif.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </body>
      {/* AdSense 사이트 소유권 인증 + 광고 스크립트. beforeInteractive를 써야
          서버 렌더링된 HTML의 <head>에 확실히 포함되어 구글 크롤러가 찾을 수 있다
          (afterInteractive는 클라이언트에서 나중에 주입되어 크롤러가 못 볼 수 있음). */}
      {ADSENSE_CLIENT_ID && (
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
      )}
    </html>
  );
}
