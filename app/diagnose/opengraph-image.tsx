import { ImageResponse } from "next/og";
import { OG_IMAGE_SIZE, buildBrandOgImage } from "@/lib/ogImage";

export const alt = "Color Fit — 무료 AI 퍼스널컬러 진단";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(buildBrandOgImage("사진 한 장으로 무료 진단 시작하기"), {
    ...size,
  });
}
