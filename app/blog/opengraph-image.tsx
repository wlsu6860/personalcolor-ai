import { ImageResponse } from "next/og";
import { OG_IMAGE_SIZE, buildBrandOgImage } from "@/lib/ogImage";

export const alt = "Color Fit 컬러 저널";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(buildBrandOgImage("컬러 저널"), { ...size });
}
