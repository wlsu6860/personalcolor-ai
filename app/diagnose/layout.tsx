import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

// page.tsx는 클라이언트 컴포넌트("use client")라 metadata를 직접 export할 수
// 없어서, 같은 세그먼트에 서버 컴포넌트 layout.tsx를 두고 여기서 대신 정의한다.
export const metadata: Metadata = {
  title: "무료 AI 퍼스널컬러 진단 시작하기",
  description:
    "사진 한 장이면 1분 안에 결과가 나와요. 웜톤·쿨톤부터 12가지 세부 시즌 타입까지, 7-Point 정밀진단으로 근거까지 확인하는 무료 AI 퍼스널컬러 진단.",
  alternates: { canonical: `${SITE_URL}/diagnose` },
};

export default function DiagnoseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
