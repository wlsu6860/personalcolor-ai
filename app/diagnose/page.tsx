"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { PersonalColorResult } from "@/lib/personalColor";
import { SEASON_META, CONFIDENCE_META, SEASONS } from "@/lib/personalColor";

type Tier = "single" | "membership";

const PRICING = {
  single: { label: "1회 리포트", price: "₩4,900", period: "1회 결제" },
  membership: { label: "프리미엄 멤버십", price: "₩9,900", period: "월 구독" },
} as const;

function extractGradientColors(gradient: string): [string, string] {
  const matches = gradient.match(/#[0-9a-fA-F]{6}/g);
  if (matches && matches.length >= 2) return [matches[0], matches[1]];
  return ["#b0794a", "#8f5f36"];
}

async function drawShareCard(
  result: PersonalColorResult,
  name: string
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  const size = 1080;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const [c1, c2] = extractGradientColors(SEASON_META[result.season].gradient);
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.textAlign = "center";

  ctx.font = "500 32px sans-serif";
  ctx.fillText(
    name ? `${name}님의 퍼스널컬러` : "나의 퍼스널컬러",
    size / 2,
    380
  );

  ctx.font = "700 90px serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(result.seasonLabel || SEASON_META[result.season].label, size / 2, 500);

  ctx.font = "400 36px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(result.subtype, size / 2, 560);

  ctx.font = "italic 600 44px serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Color Fit", size / 2, size - 100);
  ctx.font = "400 24px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("AI 퍼스널컬러 진단 · colorfit.kr", size / 2, size - 60);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

type Step = "upload" | "info" | "loading" | "result" | "error";

const LOADING_MESSAGES = [
  "피부 톤의 온도감을 살펴보고 있어요...",
  "눈동자와 모발의 명도를 확인하는 중이에요...",
  "어울리는 컬러 팔레트를 고르고 있어요...",
  "리포트를 정리하고 있어요, 거의 다 됐어요.",
];

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = ["사진 업로드", "기본 정보", "진단 결과"];
  return (
    <div className="flex items-center justify-center gap-0 mt-10 mb-2">
      {steps.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const active = n <= current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5 w-20">
              <span
                className={`w-7 h-7 rounded-full text-xs flex items-center justify-center border ${
                  active
                    ? "bg-[var(--ink)] text-[var(--background)] border-[var(--ink)]"
                    : "text-[var(--muted)] hairline"
                }`}
              >
                {n}
              </span>
              <span
                className={`text-[10px] tracking-wide ${
                  active ? "text-[var(--foreground)]" : "text-[var(--muted)]"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className="w-8 h-px bg-[var(--line)] -mt-5" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function DiagnosePage() {
  const [step, setStep] = useState<Step>("upload");
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [result, setResult] = useState<PersonalColorResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [waitlistError, setWaitlistError] = useState("");
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [shareStatus, setShareStatus] = useState<"idle" | "working" | "done">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!photo) return;
    setStep("loading");
    setErrorMessage("");

    const msgInterval = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2000);

    try {
      const formData = new FormData();
      formData.append("photo", photo);
      formData.append("name", name);

      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "분석에 실패했습니다.");
      }

      setResult(data as PersonalColorResult);
      setStep("result");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      setStep("error");
    } finally {
      clearInterval(msgInterval);
    }
  }

  async function handleShareCard() {
    if (!result) return;
    setShareStatus("working");
    try {
      const blob = await drawShareCard(result, name);
      if (!blob) throw new Error("카드 생성 실패");

      const file = new File([blob], `colorfit-${result.season}.png`, {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Color Fit — 나의 퍼스널컬러",
          text: `나는 ${result.seasonLabel}! Color Fit에서 무료로 진단받아보세요.`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
      setShareStatus("done");
    } catch {
      setShareStatus("idle");
    }
  }

  async function handleWaitlistJoin(tier: Tier) {
    if (!email) {
      setWaitlistError("이메일을 먼저 입력해주세요.");
      setWaitlistStatus("error");
      return;
    }
    setSelectedTier(tier);
    setWaitlistStatus("loading");
    setWaitlistError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          season: result?.season ?? null,
          source: "paywall",
          tier,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "등록에 실패했습니다.");
      setWaitlistStatus("done");
    } catch (err) {
      setWaitlistError(
        err instanceof Error ? err.message : "오류가 발생했습니다."
      );
      setWaitlistStatus("error");
    }
  }

  const stepNumber: 1 | 2 | 3 =
    step === "upload" ? 1 : step === "info" ? 2 : 3;

  // 결제 시스템(PG)이 아직 연동되지 않아, 지금은 항상 잠금 상태로 유지된다.
  // PG 연동 후에는 실제 결제 완료 여부로 이 값을 채워야 한다.
  const isUnlocked = false;

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
          <span className="text-xs text-[var(--muted)] tracking-widest uppercase">
            Consultation
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 pb-16">
        {step !== "loading" && step !== "error" && (
          <StepIndicator current={stepNumber} />
        )}

        <div className="w-full max-w-md mt-8">
          {step === "upload" && (
            <div className="card-surface rounded-3xl p-8 flex flex-col gap-6">
              <div>
                <p className="text-xs tracking-[0.25em] text-[var(--accent)] font-medium mb-3">
                  STEP 01
                </p>
                <h2 className="font-serif-kr text-2xl font-semibold">
                  얼굴 사진을 올려주세요
                </h2>
                <p className="text-[var(--muted)] text-sm mt-3 leading-relaxed">
                  자연광 아래에서 정면으로 찍은 사진일수록 분석이 정확해요.
                  민낯이거나 옅은 화장 상태의 사진을 추천드려요.
                </p>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square w-full rounded-2xl border border-dashed hairline bg-[var(--background)] flex items-center justify-center overflow-hidden"
              >
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="업로드한 사진 미리보기"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[var(--muted)] text-sm">
                    탭해서 사진 선택하기
                  </span>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
              />

              <button
                disabled={!photo}
                onClick={() => setStep("info")}
                className="btn-primary font-medium py-4 rounded-full text-sm tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
              >
                다음 단계로
              </button>
            </div>
          )}

          {step === "info" && (
            <div className="card-surface rounded-3xl p-8 flex flex-col gap-6">
              <div>
                <p className="text-xs tracking-[0.25em] text-[var(--accent)] font-medium mb-3">
                  STEP 02
                </p>
                <h2 className="font-serif-kr text-2xl font-semibold">
                  뭐라고 불러드릴까요?
                </h2>
                <p className="text-[var(--muted)] text-sm mt-3">
                  리포트에 사용할 호칭이에요. 별명도 좋고, 비워두셔도 괜찮아요.
                </p>
              </div>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 지수"
                className="w-full rounded-xl border hairline bg-[var(--background)] px-5 py-4 outline-none focus:border-[var(--accent)] text-sm"
              />

              <button
                onClick={handleSubmit}
                className="btn-primary font-medium py-4 rounded-full text-sm tracking-wide"
              >
                분석 시작하기
              </button>
            </div>
          )}

          {step === "loading" && (
            <div className="mt-20 flex flex-col items-center gap-8 text-center">
              <div className="w-12 h-12 rounded-full border-2 border-[var(--line)] border-t-[var(--accent)] animate-spin" />
              <div>
                <p className="font-serif-kr text-lg">잠시만 기다려주세요</p>
                <p className="text-[var(--muted)] text-sm mt-2">
                  {LOADING_MESSAGES[loadingMsgIndex]}
                </p>
              </div>
            </div>
          )}

          {step === "error" && (
            <div className="mt-20 flex flex-col items-center gap-6 text-center">
              <p className="text-red-500 text-sm">{errorMessage}</p>
              <button
                onClick={() => setStep("upload")}
                className="btn-primary font-medium px-8 py-3.5 rounded-full text-sm"
              >
                다시 시도하기
              </button>
            </div>
          )}

          {step === "result" && result && (
            <div className="flex flex-col gap-5">
              <div
                className="rounded-3xl p-10 text-white text-center"
                style={{ background: SEASON_META[result.season].gradient }}
              >
                <p className="text-xs tracking-[0.25em] opacity-80 uppercase">
                  Personal Color Report
                </p>
                <p className="text-sm opacity-85 mt-4">
                  {name ? `${name}님의 진단 결과` : "진단 결과"}
                </p>
                <h2 className="font-serif-kr text-3xl font-semibold mt-2">
                  {result.seasonLabel || SEASON_META[result.season].label}
                </h2>
                <p className="mt-1 opacity-90 text-sm">{result.subtype}</p>
                <p className="text-xs mt-4 opacity-90 font-medium">
                  {CONFIDENCE_META[result.confidence].label}
                </p>
                <p className="text-[11px] mt-0.5 opacity-60">
                  {CONFIDENCE_META[result.confidence].sub}
                </p>
              </div>

              <button
                type="button"
                onClick={handleShareCard}
                className="btn-primary font-medium py-3.5 rounded-full text-sm tracking-wide"
              >
                {shareStatus === "working"
                  ? "카드 만드는 중..."
                  : shareStatus === "done"
                  ? "저장 완료! 다시 저장하기"
                  : "📸 결과 카드 저장 · 공유하기"}
              </button>

              <div className="card-surface rounded-2xl p-7">
                <h3 className="font-serif-kr font-semibold mb-1">시즌 적합도</h3>
                <p className="text-xs text-[var(--muted)] mb-5">
                  4계절 전체를 비교해서 왜 이 타입인지 근거를 보여드려요 —
                  대부분의 진단 앱과 다른 점이에요
                </p>
                <div className="flex flex-col gap-3">
                  {SEASONS.map((s) => {
                    const score = result.seasonAffinity[s];
                    const isWinner = s === result.season;
                    return (
                      <div key={s} className="flex items-center gap-3">
                        <span
                          className={`text-xs w-14 shrink-0 ${
                            isWinner ? "font-semibold" : "text-[var(--muted)]"
                          }`}
                        >
                          {SEASON_META[s].shortLabel}
                        </span>
                        <div className="flex-1 h-2.5 rounded-full bg-[var(--background)] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${score}%`,
                              background: isWinner
                                ? SEASON_META[s].solid
                                : "var(--line)",
                            }}
                          />
                        </div>
                        <span
                          className={`text-xs w-9 text-right tabular-nums ${
                            isWinner ? "font-semibold" : "text-[var(--muted)]"
                          }`}
                        >
                          {score}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card-surface rounded-2xl p-7 flex flex-col gap-6">
                <h3 className="font-serif-kr font-semibold -mb-2">종합 소견</h3>
                <div>
                  <p className="text-xs font-semibold text-[var(--accent)] tracking-wide mb-1.5">
                    전체 톤 인상
                  </p>
                  <p className="text-sm leading-relaxed">
                    {result.freeSummary.toneImpression}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--accent)] tracking-wide mb-1.5">
                    피부 · 눈동자 · 모발의 조화
                  </p>
                  <p className="text-sm leading-relaxed">
                    {result.freeSummary.colorHarmony}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--accent)] tracking-wide mb-1.5">
                    이 타입의 매력 포인트
                  </p>
                  <p className="text-sm leading-relaxed">
                    {result.freeSummary.charmPoint}
                  </p>
                </div>
              </div>

              {isUnlocked ? (
                <div className="flex flex-col gap-5">
                  <div className="card-surface rounded-2xl p-7">
                    <h3 className="font-serif-kr font-semibold mb-3">
                      심화 컨설팅 소견
                    </h3>
                    <p className="text-sm leading-relaxed">
                      {result.premiumDetail.expertOverview}
                    </p>
                  </div>

                  <div className="card-surface rounded-2xl p-7">
                    <h3 className="font-serif-kr font-semibold mb-3">
                      피부 톤 분석
                    </h3>
                    <p className="text-sm leading-relaxed mb-4">
                      {result.premiumDetail.skinTone}
                    </p>
                    <p className="text-sm leading-relaxed text-[var(--muted)]">
                      {result.premiumDetail.reasoning}
                    </p>
                  </div>

                  <div className="card-surface rounded-2xl p-7">
                    <h3 className="font-serif-kr font-semibold mb-4">
                      베스트 컬러
                    </h3>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {result.premiumDetail.bestColors.map((c) => (
                        <div key={c.hex} className="flex flex-col items-center gap-1.5">
                          <span
                            className="w-12 h-12 rounded-full border hairline"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="text-[11px] text-[var(--muted)]">
                            {c.name}
                          </span>
                        </div>
                      ))}
                    </div>
                    <h3 className="font-serif-kr font-semibold mb-4">
                      피해야 할 컬러
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {result.premiumDetail.avoidColors.map((c) => (
                        <div key={c.hex} className="flex flex-col items-center gap-1.5">
                          <span
                            className="w-12 h-12 rounded-full border hairline opacity-70"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="text-[11px] text-[var(--muted)]">
                            {c.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {result.premiumDetail.outfitCombos?.length > 0 && (
                    <div className="card-surface rounded-2xl p-7">
                      <h3 className="font-serif-kr font-semibold mb-1">
                        톤 맞춤 아웃핏 컬러 조합
                      </h3>
                      <p className="text-xs text-[var(--muted)] mb-5">
                        {name ? `${name}님의` : "나의"} 톤에 맞춰 AI가 구성한
                        상황별 코디 색 조합이에요
                      </p>
                      <div className="flex flex-col gap-6">
                        {result.premiumDetail.outfitCombos.map((combo) => (
                          <div key={combo.occasion}>
                            <p className="text-[11px] tracking-[0.2em] text-[var(--accent)] font-medium uppercase mb-3">
                              {combo.occasion}
                            </p>
                            <div className="grid grid-cols-4 gap-2 mb-3">
                              {combo.items.map((it) => (
                                <div
                                  key={it.item}
                                  className="flex flex-col items-center gap-1.5"
                                >
                                  <span
                                    className="w-full h-14 rounded-xl border hairline"
                                    style={{ backgroundColor: it.hex }}
                                  />
                                  <span className="text-[10px] text-[var(--muted)]">
                                    {it.item}
                                  </span>
                                  <span className="text-[10px] font-medium -mt-1">
                                    {it.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-[var(--muted)] leading-relaxed">
                              {combo.tip}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="card-surface rounded-2xl p-7 flex flex-col gap-5">
                    <div>
                      <h3 className="font-serif-kr font-semibold mb-2">메이크업</h3>
                      <p className="text-sm leading-relaxed">
                        {result.premiumDetail.makeupTips}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-serif-kr font-semibold mb-2">의류 스타일링</h3>
                      <p className="text-sm leading-relaxed">
                        {result.premiumDetail.clothingTips}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-serif-kr font-semibold mb-2">헤어 컬러</h3>
                      <p className="text-sm leading-relaxed">
                        {result.premiumDetail.hairColorTips}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-center text-[var(--accent)]">
                    매주 {name ? `${name}님의` : "내"} 톤에 맞춘 아웃핏
                    레터를 보내드릴게요 ✉️
                  </p>
                </div>
              ) : (
                <div className="relative card-surface rounded-2xl p-7 overflow-hidden">
                  <div className="blur-sm select-none pointer-events-none opacity-70">
                    <h3 className="font-serif-kr font-semibold mb-3">
                      심화 컨설팅 소견
                    </h3>
                    <p className="text-sm mb-4">{result.premiumDetail.expertOverview}</p>
                    <h3 className="font-serif-kr font-semibold mb-3">상세 리포트</h3>
                    <p className="text-sm mb-3">{result.premiumDetail.skinTone}</p>
                    <div className="flex gap-2 mb-3">
                      {result.premiumDetail.bestColors.map((c) => (
                        <span
                          key={c.hex}
                          className="w-8 h-8 rounded-full inline-block"
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                    <p className="text-sm">{result.premiumDetail.makeupTips}</p>
                  </div>

                  {waitlistStatus === "done" ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--card)]/90 backdrop-blur-[2px] px-8 text-center">
                      <span className="text-xl">✅</span>
                      <p className="text-sm leading-relaxed">
                        <strong>
                          {selectedTier ? PRICING[selectedTier].label : "리포트"}
                        </strong>{" "}
                        대기 명단에 등록됐어요.
                        <br />
                        결제가 오픈되면 이 이메일로 가장 먼저 알려드릴게요.
                      </p>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--card)]/85 backdrop-blur-[2px] px-6 py-6">
                      <span className="text-lg">🔒</span>
                      <p className="text-sm text-center leading-relaxed">
                        심화 소견 · 베스트/워스트 팔레트 · 상황별 아웃핏 조합까지
                        <br />
                        <strong>전체 리포트</strong>는 아래에서 선택하실 수 있어요
                      </p>

                      <div className="w-full grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => handleWaitlistJoin("single")}
                          disabled={waitlistStatus === "loading"}
                          className="card-surface rounded-xl p-4 text-left hover:border-[var(--accent)] transition-colors disabled:opacity-50"
                        >
                          <p className="text-[10px] text-[var(--muted)] tracking-wide">
                            {PRICING.single.period}
                          </p>
                          <p className="font-serif-kr font-semibold text-lg mt-0.5">
                            {PRICING.single.price}
                          </p>
                          <p className="text-[11px] text-[var(--muted)] mt-1">
                            이 리포트 1건 전체 열람
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleWaitlistJoin("membership")}
                          disabled={waitlistStatus === "loading"}
                          className="rounded-xl p-4 text-left btn-primary transition-opacity disabled:opacity-50 relative"
                        >
                          <span className="absolute -top-2 right-3 text-[9px] bg-[var(--accent)] text-white px-2 py-0.5 rounded-full">
                            추천
                          </span>
                          <p className="text-[10px] opacity-70 tracking-wide">
                            {PRICING.membership.period}
                          </p>
                          <p className="font-serif-kr font-semibold text-lg mt-0.5">
                            {PRICING.membership.price}
                          </p>
                          <p className="text-[11px] opacity-80 mt-1">
                            무제한 재진단 + 매주 아웃핏 레터
                          </p>
                        </button>
                      </div>

                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="이메일 주소 입력 후 위에서 선택하세요"
                        className="w-full rounded-full border hairline bg-[var(--background)] px-5 py-3.5 outline-none focus:border-[var(--accent)] text-sm text-center"
                      />
                      {waitlistStatus === "error" && (
                        <p className="text-xs text-red-500">{waitlistError}</p>
                      )}
                      <p className="text-[10px] text-[var(--muted)] text-center">
                        결제 시스템 준비 중이에요. 지금은 오픈 알림 신청만 가능해요.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-[var(--muted)] text-center leading-relaxed">
                본 진단은 AI가 사진을 기반으로 추정한 참고용 결과이며,
                실제 색채 전문가의 대면 진단과 다를 수 있어요.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
