import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BLOG_POSTS, getBlogPost } from "@/lib/blogPosts";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishedAt,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(
    0,
    3,
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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

      <main className="flex-1 max-w-2xl mx-auto px-6 py-16 w-full">
        <Link
          href="/blog"
          className="text-xs text-[var(--muted)] hover:text-[var(--accent)]"
        >
          ← 컬러 저널
        </Link>

        <time className="block text-xs text-[var(--muted)] mt-6">
          {post.publishedAt}
        </time>
        <h1 className="font-serif-kr text-3xl font-semibold mt-2 mb-10 leading-snug">
          {post.title}
        </h1>

        <article className="flex flex-col gap-5">
          {post.content.map((block, i) => {
            if (block.type === "h2") {
              return (
                <h2
                  key={i}
                  className="font-serif-kr text-xl font-semibold mt-4"
                >
                  {block.text}
                </h2>
              );
            }
            if (block.type === "ul") {
              return (
                <ul key={i} className="list-disc pl-5 flex flex-col gap-1.5">
                  {block.items.map((item) => (
                    <li key={item} className="text-sm leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              );
            }
            if (block.type === "cta") {
              return (
                <Link
                  key={i}
                  href="/diagnose"
                  className="btn-primary text-center font-medium py-4 rounded-full text-sm tracking-wide mt-4"
                >
                  {block.text}
                </Link>
              );
            }
            return (
              <p key={i} className="text-sm leading-relaxed">
                {block.text}
              </p>
            );
          })}
        </article>

        <p className="text-xs text-[var(--muted)] mt-14 leading-relaxed border-t hairline pt-6">
          이 글은 일반적인 정보 제공 목적이며, 의학적·전문적 진단을 대신하지 않습니다.
        </p>

        {relatedPosts.length > 0 && (
          <div className="mt-10 pt-8 border-t hairline">
            <h2 className="font-serif-kr text-lg font-semibold mb-4">
              함께 보면 좋은 글
            </h2>
            <div className="flex flex-col gap-3">
              {relatedPosts.map((related) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="block text-sm font-medium hover:text-[var(--accent)] transition-colors"
                >
                  {related.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t hairline">
        <div className="max-w-2xl mx-auto px-6 py-8 text-center">
          <p className="text-xs text-[var(--muted)]">© 2026 Color Fit</p>
        </div>
      </footer>
    </div>
  );
}
