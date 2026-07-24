import Link from "next/link";
import SubscribeForm from "@/components/SubscribeForm";
import SeasonCardStack from "@/components/SeasonCardStack";
import { getAnalysisCount } from "@/lib/stats";
import { SITE_URL } from "@/lib/site";

// 이 숫자보다 적으면 오히려 역효과라 아예 노출하지 않는다 (가짜로 채우지 않음)
const SOCIAL_PROOF_MIN = 20;

const PROCESS = [
  {
    step: "01",
    title: "사진 업로드",
    desc: "자연광에서 촬영한 정면 사진 한 장이면 준비 끝이에요.",
  },
  {
    step: "02",
    title: "7-Point 정밀 분석",
    desc: "피부·눈동자·모발은 물론 눈썹·입술·볼혈색·이목구비 대비까지 7가지를 살펴봐요.",
  },
  {
    step: "03",
    title: "맞춤 리포트",
    desc: "시즌 타입 진단과 함께 어울리는 컬러 팔레트를 제안해드려요.",
  },
];

const TRUST = [
  { value: "4계절 × 12타입", label: "세부 시즌 분류 체계" },
  { value: "약 1분", label: "평균 분석 소요 시간" },
  { value: "7-Point 정밀진단", label: "피부 · 눈 · 모발 · 눈썹 · 입술 · 볼혈색 · 대비" },
];

const COMPARISON = [
  { label: "분석 포인트", others: "피부·눈·머리카락 3가지", us: "7가지 (+눈썹·입술·볼혈색·대비)" },
  { label: "판단 근거", others: "결과만 통보", us: "4계절 적합도 점수 전체 공개" },
  { label: "활용 가이드", others: "컬러 팔레트만 제공", us: "데일리·오피스·데이트 코디 3세트" },
  { label: "재방문 가치", others: "1회성 결과, 끝", us: "매주 맞춤 아웃핏 레터" },
  { label: "신뢰도 표기", others: "표기 없음", us: "사진 품질 기반 정밀도 등급 공개" },
];

const PALETTE_STRIP = [
  "#ffd9a0", "#ffab91", "#ff8a80", "#f48fb1",
  "#c5d9ff", "#a8c8f0", "#c8b8e8", "#90caf9",
  "#e0b070", "#b97a45", "#8a5a30", "#6d4c41",
  "#7c90d8", "#5e60ce", "#3f3d9e", "#283593",
];

function Brand() {
  return (
    <span className="flex items-baseline gap-2.5">
      <span className="font-display italic text-2xl tracking-tight">
        Color Fit
      </span>
      <span className="text-[13px] text-[var(--muted)] tracking-[0.2em]">
        컬러핏
      </span>
    </span>
  );
}

export default async function Home() {
  const analysisCount = await getAnalysisCount().catch(() => 0);
  const showSocialProof = analysisCount >= SOCIAL_PROOF_MIN;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Color Fit",
    alternateName: "컬러핏",
    url: SITE_URL,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    description:
      "사진 한 장으로 웜톤·쿨톤부터 세부 시즌 타입까지 분석하는 AI 퍼스널컬러 진단 서비스",
    offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
  };

  return (
    <div className="flex-1 flex flex-col overflow-x-clip">
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="border-b hairline sticky top-0 bg-[var(--background)]/85 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <Brand />
          <Link
            href="/blog"
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] mr-auto ml-8 hidden sm:inline"
          >
            컬러 저널
          </Link>
          <Link
            href="/diagnose"
            className="btn-primary text-xs font-medium px-5 py-2.5 rounded-full tracking-wide"
          >
            진단 시작
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* ---------- HERO ---------- */}
        <section className="max-w-6xl mx-auto px-6 pt-16 sm:pt-24 pb-24 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-16 items-center">
          <div>
            <p className="fade-up text-[11px] tracking-[0.35em] text-[var(--accent)] font-medium mb-8 uppercase">
              AI Personal Color Consultation
            </p>

            <h1 className="headline-hero fade-up delay-1">
              <span className="headline-line">사진 한 장이면 충분해요,</span>
              <span className="headline-line">
                나에게 어울리는{" "}
                <span className="font-display italic accent-text">컬러</span>를
              </span>
              <span className="headline-line">찾아드릴게요</span>
            </h1>

            <p className="fade-up delay-2 text-[var(--muted)] max-w-md text-base leading-relaxed mt-9">
              얼굴 사진을 업로드하면 AI가 웜톤·쿨톤부터 세부 시즌 타입까지
              차분하게 분석해드려요. 기본 진단 결과는 무료입니다.
            </p>

            <p className="fade-up delay-2 text-xs text-[var(--accent-deep)] font-medium mt-4">
              피부·눈·모발 3가지만 보는 다른 진단과 달리,{" "}
              <span className="font-display italic">7-Point 정밀진단</span>으로 근거까지 보여드려요
            </p>

            <div className="fade-up delay-3 mt-11 flex items-center gap-6">
              <Link
                href="/diagnose"
                className="btn-primary font-medium px-10 py-4.5 rounded-full text-sm tracking-wide"
              >
                무료 진단 시작하기
              </Link>
              <span className="text-xs text-[var(--muted)]">
                회원가입 없이
                <br />
                바로 진행돼요
              </span>
            </div>

            {showSocialProof && (
              <p className="fade-up delay-4 text-xs text-[var(--muted)] mt-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] inline-block" />
                지금까지{" "}
                <strong className="text-[var(--foreground)] tabular-nums">
                  {analysisCount.toLocaleString("ko-KR")}명
                </strong>
                이 컬러핏으로 진단받았어요
              </p>
            )}
          </div>

          {/* season card stack — 마우스를 따라 살짝 반응하는 패럴랙스 */}
          <SeasonCardStack />
        </section>

        {/* ---------- PALETTE STRIP ---------- */}
        <section className="border-y hairline bg-[var(--card)]/70">
          <div className="max-w-6xl mx-auto px-6 py-7 flex items-center justify-between gap-6">
            <span className="text-[11px] tracking-[0.3em] text-[var(--muted)] uppercase shrink-0 hidden sm:block">
              Seasonal Palette
            </span>
            <div className="flex gap-2.5 flex-wrap justify-center flex-1">
              {PALETTE_STRIP.map((hex) => (
                <span
                  key={hex}
                  className="palette-dot w-6 h-6 rounded-full inline-block"
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ---------- WHY COLOR FIT ---------- */}
        <section className="max-w-4xl mx-auto px-6 py-24">
          <p className="text-[11px] tracking-[0.35em] text-[var(--accent)] font-medium text-center mb-4 uppercase">
            Why Color Fit
          </p>
          <h2 className="font-serif-kr text-2xl sm:text-3xl font-semibold text-center mb-4">
            같은 &lsquo;퍼스널컬러 진단&rsquo;이어도,
            <br />
            보는 깊이가 다릅니다
          </h2>
          <p className="text-sm text-[var(--muted)] text-center max-w-md mx-auto mb-14 leading-relaxed">
            일반적인 진단 앱과 비교하면 차이가 분명해요
          </p>

          <div className="card-surface rounded-3xl overflow-hidden">
            <div className="grid grid-cols-[1.1fr_1fr_1.2fr] text-xs sm:text-sm">
              <div className="p-5 sm:p-6 font-medium text-[var(--muted)]">비교 항목</div>
              <div className="p-5 sm:p-6 text-[var(--muted)] border-l hairline">
                일반 진단 앱
              </div>
              <div className="p-5 sm:p-6 font-semibold border-l hairline bg-[var(--accent-tint)]">
                <span className="font-display italic accent-text">Color Fit</span>
              </div>

              {COMPARISON.map((row) => (
                <div key={row.label} className="contents">
                  <div className="p-5 sm:p-6 border-t hairline font-medium">
                    {row.label}
                  </div>
                  <div className="p-5 sm:p-6 border-t hairline border-l text-[var(--muted)]">
                    {row.others}
                  </div>
                  <div className="p-5 sm:p-6 border-t hairline border-l font-medium transition-colors hover:bg-[var(--accent-tint)]">
                    ✓ {row.us}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- TRUST ---------- */}
        <section className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
          {TRUST.map((item) => (
            <div key={item.label}>
              <p className="font-serif-kr text-2xl font-semibold">{item.value}</p>
              <p className="text-xs text-[var(--muted)] mt-2 tracking-wide">
                {item.label}
              </p>
            </div>
          ))}
        </section>

        {/* ---------- PROCESS ---------- */}
        <section className="border-t hairline">
          <div className="max-w-6xl mx-auto px-6 py-24">
            <p className="text-[11px] tracking-[0.35em] text-[var(--accent)] font-medium text-center mb-4 uppercase">
              How it works
            </p>
            <h2 className="font-serif-kr text-3xl font-semibold text-center mb-16">
              진단은 이렇게 진행돼요
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {PROCESS.map((item) => (
                <div
                  key={item.step}
                  className="card-surface rounded-3xl p-9 text-left transition-transform duration-300 hover:-translate-y-1.5"
                >
                  <span className="font-display italic text-3xl accent-text">
                    {item.step}
                  </span>
                  <h3 className="font-serif-kr font-semibold text-lg mt-5 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- NEWSLETTER ---------- */}
        <section className="border-t hairline bg-[var(--card)]/70">
          <div className="max-w-6xl mx-auto px-6 py-20 text-center">
            <p className="text-[11px] tracking-[0.35em] text-[var(--accent)] font-medium mb-4 uppercase">
              Weekly Outfit Letter
            </p>
            <h2 className="font-serif-kr text-2xl sm:text-3xl font-semibold mb-4">
              매주 한 통, 내 톤에 맞춘 아웃핏 컬러 조합
            </h2>
            <p className="text-sm text-[var(--muted)] max-w-md mx-auto mb-8 leading-relaxed">
              &ldquo;이번 주엔 이 색 조합&rdquo; — 내 시즌 타입에 맞춘 상의·하의·아우터·포인트
              색 조합과 스타일링 팁을 이메일로 보내드려요.
            </p>
            <div className="flex justify-center gap-2 mb-8">
              {["#f0e0c8", "#8a9a7b", "#6d4c41", "#c9a26d"].map((hex, i) => (
                <span
                  key={hex}
                  className="w-9 h-12 rounded-lg border hairline inline-block"
                  style={{ backgroundColor: hex, transform: `rotate(${(i - 1.5) * 4}deg)` }}
                />
              ))}
            </div>
            <SubscribeForm source="landing" />
          </div>
        </section>

        {/* ---------- FINAL CTA ---------- */}
        <section className="border-t hairline bg-[var(--ink)] text-[var(--background)]">
          <div className="max-w-6xl mx-auto px-6 py-24 text-center">
            <p className="font-display italic text-lg opacity-60 mb-5">
              Find your true colors
            </p>
            <h2 className="font-serif-kr text-3xl sm:text-4xl font-semibold leading-snug">
              오늘, 나의 컬러를
              <br />
              만나보세요
            </h2>
            <Link
              href="/diagnose"
              className="inline-block mt-10 bg-[var(--background)] text-[var(--ink)] font-medium px-10 py-4 rounded-full text-sm tracking-wide hover:opacity-90 transition-opacity"
            >
              무료 진단 시작하기
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t hairline">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Brand />
          <p className="text-xs text-[var(--muted)] leading-relaxed max-w-sm text-center sm:text-right">
            본 서비스는 AI 이미지 분석 기반의 참고용 진단으로, 조명과 사진
            화질에 따라 결과가 달라질 수 있습니다. ©{" "}
            {new Date().getFullYear()} Color Fit ·{" "}
            <Link href="/privacy" className="underline hover:no-underline">
              개인정보처리방침
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
