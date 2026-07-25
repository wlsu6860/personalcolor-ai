import { ImageResponse } from "next/og";
import { OG_IMAGE_SIZE, buildBrandOgImage } from "@/lib/ogImage";
import { getBlogPost } from "@/lib/blogPosts";

export const alt = "Color Fit 컬러 저널";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  return new ImageResponse(buildBrandOgImage(post?.title ?? "컬러 저널"), {
    ...size,
  });
}
