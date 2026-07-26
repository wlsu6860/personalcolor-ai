import { NextResponse } from "next/server";
import { getSubscriberCount } from "@/lib/subscriberStore";

export const runtime = "nodejs";

// 이메일 등록 화면의 "선착순 N명 한정" 문구에 실제 숫자를 붙이기 위한 공개 집계
// 엔드포인트. 개인정보(이메일 목록 등)는 절대 반환하지 않고 총 인원 수만 노출한다.
export async function GET() {
  const count = await getSubscriberCount().catch(() => 0);
  return NextResponse.json({ count });
}
