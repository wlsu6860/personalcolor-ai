import Link from "next/link";
import type { Metadata } from "next";
import { BLOG_POSTS } from "@/lib/blogPosts";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "컬러 저널",
  description:
    "퍼스널컬러를 더 잘 알고 싶은 분들을 위한 가이드 — 자가진단법부터 컬러별 스타일링 팁까지.",
  alternates: { canonical: `${SITE_URL}/blog` },
};

export default function BlogIndexPage() {
  const posts = [...BLOG_POSTS].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt)
  );

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b hairline sticky top-0 bg-[var(--background)]/85 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-baseline gap-2.5">
            <span className="font-display italic text-2xl tracking-tight">
              Color Fit
            </span>
            <span className="text-[13px] text-[var(--muted)] tracking-[0.2em]">
              컬러핏
            </span>
          </Link>
          <Link
            href="/diagnose"
            className="btn-primary text-xs font-medium px-5 py-2.5 rounded-full tracking-wide"
          >
            진단 시작
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 w-full">
        <p className="text-[11px] tracking-[0.35em] text-[var(--accent)] font-medium mb-4 uppercase">
          Color Journal
        </p>
        <h1 className="font-serif-kr text-3xl font-semibold mb-3">
          컬러 저널
        </h1>
        <p className="text-sm text-[var(--muted)] mb-14 leading-relaxed">
          퍼스널컬러를 더 잘 알고 싶은 분들을 위한 가이드예요.
        </p>

        <div className="flex flex-col gap-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="card-surface rounded-2xl p-7 block transition-transform hover:-translate-y-1"
            >
              <time className="text-xs text-[var(--muted)]">
                {post.publishedAt}
              </time>
              <h2 className="font-serif-kr text-xl font-semibold mt-2 mb-2">
                {post.title}
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                {post.description}
              </p>
            </Link>
          ))}
        </div>
      </main>

      <footer className="border-t hairline">
        <div className="max-w-3xl mx-auto px-6 py-8 text-center">
          <p className="text-xs text-[var(--muted)]">© 2026 Color Fit</p>
        </div>
      </footer>
    </div>
  );
}
