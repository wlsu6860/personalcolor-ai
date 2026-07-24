import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Serif_KR, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Color Fit — 컬러핏 | AI 퍼스널컬러 진단",
    template: "%s | Color Fit",
  },
  description:
    "사진 한 장으로 받아보는 AI 퍼스널컬러 분석. 웜톤·쿨톤부터 12가지 세부 시즌 타입까지.",
  verification: {
    google: "S26P5aNGKnm9jhxtYTe4WZLlOWNQ0JsByHCTNrGdIN8",
    other: {
      "naver-site-verification": "ac0db4684d2e2f089f50888777cf60145c47cb59",
    },
  },
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
        {/* AdSense 사이트 소유권 인증 + 광고 스크립트. beforeInteractive 전략이면
            <body> 안에 적어도 Next.js가 실제로는 서버 렌더링된 HTML의 <head>로
            옮겨서 넣어준다 — <html>의 직속 자식으로 두면 HTML 구조상 허용되지
            않아 하이드레이션 에러가 났다. */}
        {ADSENSE_CLIENT_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </body>
    </html>
  );
}
