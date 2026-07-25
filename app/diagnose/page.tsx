"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { PersonalColorResult } from "@/lib/personalColor";
import {
  SEASON_META,
  CONFIDENCE_META,
  SEASONS,
  ANALYSIS_FACTOR_KEYS,
  ANALYSIS_FACTOR_META,
} from "@/lib/personalColor";
import ColorDrape from "@/components/ColorDrape";
import AdRewardGate from "@/components/AdRewardGate";
import OutfitItemIcon from "@/components/OutfitItemIcon";

const REASSURANCE_MESSAGES = [
  "AI가 신중하게 최종 리포트를 작성하고 있어요",
  "정확도를 높이기 위해 한 번 더 확인하고 있어요",
  "꼼꼼한 분석일수록 시간이 조금 더 걸려요",
  "거의 다 됐어요, 조금만 기다려주세요",
];

type Tier = "single" | "membership";

const PRICING = {
  single: { label: "1회 리포트", price: "₩4,900", period: "1회 결제" },
  membership: { label: "프리미엄 멤버십", price: "₩9,900", period: "월 구독" },
} as const;

const SOCIAL_PROOF_MIN = 20;

// 완성도 게이지 계산 근거 — 실제 리포트 섹션 수를 세서 비율을 낸다 (임의의 숫자 아님)
const FREE_SECTION_COUNT = 6; // 시즌 적합도, 톤 인상, 색채 조화, 매력 포인트, 7가지 분석 포인트 체크리스트, 심화소견(광고 시청 시)
const LOCKED_SECTION_COUNT = 11; // 7가지 관찰결과, 피부톤, 판단근거, 베스트/워스트컬러, 코디3, 메이크업, 의류, 헤어

function extractGradientColors(gradient: string): [string, string] {
  const matches = gradient.match(/#[0-9a-fA-F]{6}/g);
  if (matches && matches.length >= 2) return [matches[0], matches[1]];
  return ["#b0794a", "#8f5f36"];
}

/**
 * 업로드 전 사진을 리사이즈·압축해서 항상 작고 깨끗한 JPEG로 만든다.
 *
 * 처음엔 File을 arrayBuffer()로 통째로 읽었는데 대용량 사진(특히 고사양 카메라)에서
 * 모바일 브라우저 메모리 문제로 실패했고, 그다음 createImageBitmap으로 바꿨더니
 * 이번엔 일부 환경에서 createImageBitmap 자체가 특정 이미지를 디코딩하지 못해
 * 계속 실패하는 문제가 있었다. 대신 업로드 미리보기에서 이미 검증된, 가장 호환성
 * 넓은 방식 — <img> 엘리먼트로 디코딩 — 하나로 통일한다.
 */
async function resizeImageForUpload(
  file: File,
  maxDimension = 1600,
  quality = 0.85
): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("이미지를 불러올 수 없어요."));
      el.src = objectUrl;
    });

    const width = img.naturalWidth;
    const height = img.naturalHeight;
    if (!width || !height) {
      throw new Error("이미지 크기를 확인할 수 없어요.");
    }

    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("이미지를 처리할 수 없어요.");
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob) throw new Error("이미지를 압축하는 중 문제가 발생했어요.");
    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

// 쿠팡파트너스 가입·승인 전까지의 임시 조치 — 지금은 수수료 없는 일반 검색
// 링크만 연결한다. 승인되면 이 함수 내부만 쿠팡 파트너스 대시보드에서 발급받은
// 실제 트래킹 링크로 바꿔주면 나머지 UI는 그대로 재사용된다. 그때는 바로 아래
// 안내 문구도 "제휴 링크를 통해 수수료를 받을 수 있다"는 고지로 함께 바꿔야 한다
// (지금은 실제 수수료가 없는 일반 링크라 고지 문구를 넣지 않음).
function shoppingSearchUrl(query: string): string {
  return `https://www.coupang.com/np/search?component=&q=${encodeURIComponent(query)}`;
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
  const [reassuranceIndex, setReassuranceIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [waitlistError, setWaitlistError] = useState("");
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [shareStatus, setShareStatus] = useState<"idle" | "working" | "done">("idle");
  const [barsAnimated, setBarsAnimated] = useState(false);
  const [scanReady, setScanReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "result") {
      const t = setTimeout(() => setBarsAnimated(true), 200);
      return () => clearTimeout(t);
    }
    setBarsAnimated(false);
  }, [step]);

  // 스캔 애니메이션(scanSweep, 2.6s)이 끝날 때까지 "다음 단계로"를 비활성화해서
  // 사용자가 사진 선택 직후 스캔 연출을 스캔 결과로 착각해 너무 빨리 넘어가지 않게 한다.
  useEffect(() => {
    if (!previewUrl) {
      setScanReady(false);
      return;
    }
    setScanReady(false);
    const t = setTimeout(() => setScanReady(true), 2600);
    return () => clearTimeout(t);
  }, [previewUrl]);

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

    setLoadingMsgIndex(0);
    setReassuranceIndex(0);
    const msgInterval = setInterval(() => {
      setLoadingMsgIndex((i) => Math.min(i + 1, ANALYSIS_FACTOR_KEYS.length - 1));
    }, 1200);
    // 체크리스트가 다 채워진 뒤에도(실제 분석은 그보다 훨씬 오래 걸림) 화면이
    // "멈춘 것처럼" 보이지 않도록, 계속 바뀌는 안내 문구를 별도로 돌린다.
    const reassureInterval = setInterval(() => {
      setReassuranceIndex((i) => (i + 1) % REASSURANCE_MESSAGES.length);
    }, 3200);

    try {
      // 업로드 전 리사이즈·압축 — 대용량 사진의 메모리 문제(안드로이드)와
      // 비표준 MIME 타입 문제(iOS Safari)를 한 번에 해결한다.
      let normalizedPhoto: Blob;
      try {
        normalizedPhoto = await resizeImageForUpload(photo);
      } catch (err) {
        console.error("[resize] 사진 리사이즈 실패:", err);
        throw new Error("사진을 처리하는 중 문제가 발생했어요. 다른 사진으로 다시 시도해주세요.");
      }

      const formData = new FormData();
      formData.append("photo", normalizedPhoto, "photo.jpg");
      formData.append("name", name);

      let res: Response;
      try {
        res = await fetch("/api/analyze", { method: "POST", body: formData });
      } catch {
        throw new Error("네트워크 연결을 확인하고 다시 시도해주세요.");
      }

      let data: PersonalColorResult & { error?: string };
      try {
        data = await res.json();
      } catch {
        throw new Error("서버 응답을 처리할 수 없어요. 잠시 후 다시 시도해주세요.");
      }

      if (!res.ok) {
        throw new Error(data.error || "분석에 실패했습니다.");
      }

      setResult(data as PersonalColorResult);
      setStep("result");
    } catch (err) {
      // 위에서 던진 에러는 전부 사용자에게 보여줘도 되는 한국어 메시지로 정리해뒀다.
      // 혹시 모를 예기치 못한 예외만 일반 문구로 덮는다.
      setErrorMessage(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했어요. 다시 시도해주세요."
      );
      setStep("error");
    } finally {
      clearInterval(msgInterval);
      clearInterval(reassureInterval);
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

  function handleSelectTier(tier: Tier) {
    setSelectedTier(tier);
    setWaitlistError("");
    if (waitlistStatus === "error") setWaitlistStatus("idle");
  }

  async function handleWaitlistSubmit() {
    if (!selectedTier) {
      setWaitlistError("먼저 위에서 옵션을 선택해주세요.");
      setWaitlistStatus("error");
      return;
    }
    if (!email) {
      setWaitlistError("이메일을 입력해주세요.");
      setWaitlistStatus("error");
      return;
    }
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
          tier: selectedTier,
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
                className="relative aspect-square w-full rounded-2xl border border-dashed hairline bg-[var(--background)] flex items-center justify-center overflow-hidden"
              >
                {previewUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="업로드한 사진 미리보기"
                      className="w-full h-full object-cover"
                    />
                    {!scanReady && (
                      <div className="scan-overlay">
                        <div className="scan-line" />
                      </div>
                    )}
                    <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] bg-[var(--ink)]/80 text-[var(--background)] px-3 py-1 rounded-full tracking-wide">
                      {scanReady ? "확인 완료! 다음 단계로 넘어가주세요" : "컬러핏이 사진을 살펴보고 있어요"}
                    </span>
                  </>
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
                disabled={!photo || !scanReady}
                onClick={() => setStep("info")}
                className="btn-primary font-medium py-4 rounded-full text-sm tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {photo && !scanReady ? "사진 확인 중..." : "다음 단계로"}
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
            <div className="mt-10 flex flex-col items-center gap-8">
              <div className="relative w-36 h-36">
                {previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="분석 중인 사진"
                    className="w-full h-full object-cover rounded-full"
                  />
                )}
                <div className="scan-overlay rounded-full">
                  <div className="scan-line" />
                </div>
                <div className="absolute -inset-1.5 rounded-full border-2 border-transparent border-t-[var(--accent)] border-r-[var(--accent)] scan-ring" />
                <span
                  className="scan-marker absolute top-4 left-6 w-2 h-2 rounded-full bg-[var(--accent)]"
                  style={{ animationDelay: "0s" }}
                />
                <span
                  className="scan-marker absolute bottom-7 right-2 w-2 h-2 rounded-full bg-[var(--accent)]"
                  style={{ animationDelay: "0.5s" }}
                />
                <span
                  className="scan-marker absolute top-1/2 -right-1 w-2 h-2 rounded-full bg-[var(--accent)]"
                  style={{ animationDelay: "1s" }}
                />
              </div>
              <div>
                <p className="font-serif-kr text-lg text-center">
                  컬러핏 7-Point 정밀진단 진행 중
                </p>
                <p className="text-xs text-[var(--muted)] text-center mt-1.5">
                  전문 컨설턴트가 보는 방식 그대로, 7가지를 하나씩 확인하고 있어요
                </p>
              </div>
              <div className="w-full max-w-xs flex flex-col gap-3">
                {ANALYSIS_FACTOR_KEYS.map((key, i) => {
                  const checked = i < loadingMsgIndex;
                  const active = i === loadingMsgIndex;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 border transition-colors ${
                          checked
                            ? "bg-[var(--ok)] border-[var(--ok)] text-white"
                            : "border-[var(--line)] text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                      <span
                        className={`text-sm ${
                          active
                            ? "font-medium"
                            : checked
                            ? "text-[var(--muted)]"
                            : "text-[var(--muted)] opacity-50"
                        }`}
                      >
                        {ANALYSIS_FACTOR_META[key].label}
                      </span>
                      {active && (
                        <span className="w-3 h-3 rounded-full border-2 border-[var(--line)] border-t-[var(--accent)] animate-spin shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
              <p
                key={reassuranceIndex}
                className="fade-up text-xs text-[var(--accent-deep)] text-center max-w-[220px]"
              >
                {REASSURANCE_MESSAGES[reassuranceIndex]}
              </p>
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
              {(() => {
                const bestColorsCount = result.premiumDetail.bestColors.length;
                const avoidColorsCount = result.premiumDetail.avoidColors.length;
                const outfitComboCount = result.premiumDetail.outfitCombos?.length ?? 0;
                const firstBestColor = result.premiumDetail.bestColors[0];
                const unlockedPercent = Math.round(
                  (FREE_SECTION_COUNT / (FREE_SECTION_COUNT + LOCKED_SECTION_COUNT)) * 100
                );
                const analysisCount = result.communityCount ?? 0;
                const showSocialProof = analysisCount >= SOCIAL_PROOF_MIN;

                return (
                  <>
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
                            className="h-full rounded-full fill-grow"
                            style={{
                              width: barsAnimated ? `${score}%` : "0%",
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

              {!isUnlocked && (
                <AdRewardGate
                  unlockedContent={
                    <div className="flex flex-col gap-4">
                      <div>
                        <p className="text-xs font-semibold text-[var(--accent)] tracking-wide mb-1.5">
                          인접 타입과의 차이
                        </p>
                        <p className="text-sm leading-relaxed">
                          {result.premiumDetail.expertCommentary.differentiation}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[var(--accent)] tracking-wide mb-1.5">
                          이 톤만의 심화 뉘앙스
                        </p>
                        <p className="text-sm leading-relaxed">
                          {result.premiumDetail.expertCommentary.nuance}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[var(--accent)] tracking-wide mb-1.5">
                          실전 활용 유의점
                        </p>
                        <p className="text-sm leading-relaxed">
                          {result.premiumDetail.expertCommentary.practicalTip}
                        </p>
                      </div>
                    </div>
                  }
                />
              )}

              <div className="card-surface rounded-2xl p-7">
                <h3 className="font-serif-kr font-semibold mb-1">
                  컬러핏 7-Point 정밀진단
                </h3>
                <p className="text-xs text-[var(--muted)] mb-5">
                  피부·눈동자·모발 3가지만 보는 다른 진단과 달리, 눈썹·입술·볼
                  혈색·이목구비 대비까지 함께 확인해요
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {ANALYSIS_FACTOR_KEYS.map((key) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-[var(--ok)] text-sm shrink-0">✓</span>
                      <span className="text-xs">{ANALYSIS_FACTOR_META[key].label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {isUnlocked ? (
                <div className="flex flex-col gap-5">
                  <div className="card-surface rounded-2xl p-7 flex flex-col gap-4">
                    <h3 className="font-serif-kr font-semibold -mb-2">
                      심화 컨설팅 소견
                    </h3>
                    <div>
                      <p className="text-xs font-semibold text-[var(--accent)] tracking-wide mb-1.5">
                        인접 타입과의 차이
                      </p>
                      <p className="text-sm leading-relaxed">
                        {result.premiumDetail.expertCommentary.differentiation}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--accent)] tracking-wide mb-1.5">
                        이 톤만의 심화 뉘앙스
                      </p>
                      <p className="text-sm leading-relaxed">
                        {result.premiumDetail.expertCommentary.nuance}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--accent)] tracking-wide mb-1.5">
                        실전 활용 유의점
                      </p>
                      <p className="text-sm leading-relaxed">
                        {result.premiumDetail.expertCommentary.practicalTip}
                      </p>
                    </div>
                  </div>

                  <div className="card-surface rounded-2xl p-7">
                    <h3 className="font-serif-kr font-semibold mb-4">
                      7-Point 정밀진단 관찰 결과
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ANALYSIS_FACTOR_KEYS.map((key) => (
                        <div
                          key={key}
                          className="rounded-xl bg-[var(--background)] px-4 py-3"
                        >
                          <p className="text-[10px] text-[var(--muted)] mb-0.5">
                            {ANALYSIS_FACTOR_META[key].label}
                          </p>
                          <p className="text-xs font-medium">
                            {result.premiumDetail.analysisFactors[key]}
                          </p>
                        </div>
                      ))}
                    </div>
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
                    <h3 className="font-serif-kr font-semibold mb-1">
                      나에게 이 컬러를 입혀보면
                    </h3>
                    <p className="text-xs text-[var(--muted)] mb-5">
                      스와치를 하나씩 눌러서 얼굴 옆에 대본 모습을 확인해보세요
                    </p>
                    <ColorDrape
                      photoUrl={previewUrl}
                      colors={result.premiumDetail.bestColors}
                    />
                    <h3 className="font-serif-kr font-semibold mb-4 mt-8">
                      피해야 할 컬러
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
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
                        상황별 코디 색 조합이에요 · 아이템을 누르면 비슷한 색
                        상품을 찾아드려요
                      </p>
                      <div className="flex flex-col gap-6">
                        {result.premiumDetail.outfitCombos.map((combo) => (
                          <div key={combo.occasion}>
                            <p className="text-[11px] tracking-[0.2em] text-[var(--accent)] font-medium uppercase mb-3">
                              {combo.occasion}
                            </p>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              {combo.items.map((it) => (
                                <a
                                  key={it.item}
                                  href={shoppingSearchUrl(`${it.name} ${it.item}`)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex flex-col items-center gap-1.5 group"
                                >
                                  <div className="w-full aspect-square rounded-xl border hairline bg-[var(--background)] flex items-center justify-center p-2.5 transition-transform group-hover:-translate-y-0.5 group-hover:border-[var(--accent)]">
                                    <OutfitItemIcon
                                      item={it.item}
                                      hex={it.hex}
                                      className="w-full h-full"
                                    />
                                  </div>
                                  <span className="text-[10px] text-[var(--muted)]">
                                    {it.item}
                                  </span>
                                  <span className="text-[10px] font-medium -mt-1 group-hover:text-[var(--accent)]">
                                    {it.name}
                                  </span>
                                </a>
                              ))}
                            </div>
                            <p className="text-xs text-[var(--muted)] leading-relaxed">
                              {combo.tip}
                            </p>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-[var(--muted)] mt-6 leading-relaxed">
                        ※ 아이템을 누르면 색상·품목명으로 쇼핑몰 상품을
                        검색해드려요.
                      </p>
                    </div>
                  )}

                  <div className="card-surface rounded-2xl p-7 flex flex-col gap-5">
                    <div>
                      <h3 className="font-serif-kr font-semibold mb-2">메이크업</h3>
                      <p className="text-sm leading-relaxed mb-4">
                        {result.premiumDetail.makeupTips}
                      </p>
                      {result.premiumDetail.makeupPalette?.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                          {result.premiumDetail.makeupPalette.map((p) => (
                            <a
                              key={p.category}
                              href={shoppingSearchUrl(`${p.shade} ${p.category}`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex flex-col items-center gap-1.5 group"
                            >
                              <span
                                className="w-full aspect-square rounded-full border hairline transition-transform group-hover:-translate-y-0.5 group-hover:border-[var(--accent)]"
                                style={{ backgroundColor: p.hex }}
                              />
                              <span className="text-[10px] text-[var(--muted)]">
                                {p.category}
                              </span>
                              <span className="text-[10px] font-medium -mt-1 text-center group-hover:text-[var(--accent)]">
                                {p.shade}
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
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
                <div className="flex flex-col gap-4">
                  {/* 완성도 게이지 — 자이가르닉 효과: 미완성 상태를 보여주면 끝까지 보고 싶어짐 */}
                  <div className="card-surface rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium">리포트 열람 진행률</span>
                      <span className="text-xs text-[var(--muted)] tabular-nums">
                        {unlockedPercent}% 공개됨
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--background)] overflow-hidden">
                      <div
                        className="h-full rounded-full fill-grow"
                        style={{
                          width: barsAnimated ? `${unlockedPercent}%` : "0%",
                          background: "var(--accent)",
                        }}
                      />
                    </div>
                  </div>

                  {/* 무료 미리보기: 텍스트/원형 스와치 대신 실제 사진 옆에 컬러를 대보는 드레이핑으로 —
                      "구체적으로 뭘 놓치는지" 시각적으로 보여줘야 사고 싶어짐 */}
                  {firstBestColor && (
                    <div className="card-surface rounded-2xl p-6">
                      <h3 className="font-serif-kr font-semibold mb-1">
                        이 컬러, 이렇게 입어보세요
                      </h3>
                      <p className="text-xs text-[var(--muted)] mb-5">
                        실제 얼굴 옆에 컬러를 대보는 드레이핑 방식으로 확인해요
                      </p>
                      <ColorDrape
                        photoUrl={previewUrl}
                        colors={[firstBestColor]}
                        lockedCount={Math.max(bestColorsCount - 1, 0)}
                      />
                      <p className="text-xs text-[var(--muted)] mt-5">
                        이런 베스트 컬러가 {Math.max(bestColorsCount - 1, 0)}개 더, 피해야 할
                        컬러가 {avoidColorsCount}개 준비되어 있어요
                      </p>
                    </div>
                  )}

                  <div className="relative card-surface rounded-2xl p-7 overflow-hidden">
                    <div className="blur-sm select-none pointer-events-none opacity-70">
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
                        <strong>
                          {name ? `${name}님을` : "회원님을"} 위한 컬러{" "}
                          {bestColorsCount + avoidColorsCount}개 · 코디{" "}
                          {outfitComboCount}세트 · 뷰티팁 3가지
                        </strong>
                        가 준비됐어요
                      </p>

                      <div className="w-full grid grid-cols-2 gap-3">
                        {(["single", "membership"] as Tier[]).map((tier) => {
                          const isSelected = selectedTier === tier;
                          const isMembership = tier === "membership";
                          return (
                            <button
                              key={tier}
                              type="button"
                              onClick={() => handleSelectTier(tier)}
                              disabled={waitlistStatus === "loading"}
                              aria-pressed={isSelected}
                              className={`relative rounded-xl p-4 text-left transition-all border-2 disabled:opacity-50 ${
                                isSelected
                                  ? "border-[var(--accent)] bg-[var(--accent-tint)] scale-[1.03]"
                                  : "border-transparent card-surface hover:border-[var(--line)]"
                              }`}
                            >
                              {isMembership && (
                                <span className="absolute -top-2 right-3 text-[9px] bg-[var(--accent)] text-white px-2 py-0.5 rounded-full">
                                  추천
                                </span>
                              )}
                              {isSelected && (
                                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[var(--accent)] text-white text-[9px] flex items-center justify-center">
                                  ✓
                                </span>
                              )}
                              <p className="text-[10px] text-[var(--muted)] tracking-wide">
                                {PRICING[tier].period}
                              </p>
                              <p className="font-serif-kr font-semibold text-lg mt-0.5">
                                {PRICING[tier].price}
                              </p>
                              <p className="text-[11px] text-[var(--muted)] mt-1">
                                {isMembership
                                  ? "무제한 재진단 + 매주 아웃핏 레터"
                                  : "이 리포트 1건 전체 열람"}
                              </p>
                            </button>
                          );
                        })}
                      </div>

                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="이메일 주소"
                        className="w-full rounded-full border hairline bg-[var(--background)] px-5 py-3.5 outline-none focus:border-[var(--accent)] text-sm text-center"
                      />

                      <button
                        type="button"
                        onClick={handleWaitlistSubmit}
                        disabled={waitlistStatus === "loading" || !selectedTier}
                        className="btn-primary w-full font-medium py-3.5 rounded-full text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {waitlistStatus === "loading"
                          ? "등록 중..."
                          : selectedTier
                          ? `${PRICING[selectedTier].label} 대기 등록하기`
                          : "옵션을 먼저 선택해주세요"}
                      </button>

                      {waitlistStatus === "error" && (
                        <p className="text-xs text-red-500">{waitlistError}</p>
                      )}
                      <p className="text-[10px] text-[var(--muted)] text-center leading-relaxed">
                        오프라인 퍼스널컬러 상담 5~15만원 · 상세 리포트는 그 1/10 가격이에요
                        <br />
                        결제 시스템 준비 중이라, 지금은 오픈 알림 신청만 가능해요.
                        {showSocialProof && (
                          <>
                            <br />
                            지금까지 {analysisCount.toLocaleString("ko-KR")}명이 컬러핏으로
                            진단받았어요
                          </>
                        )}
                      </p>
                    </div>
                  )}
                  </div>
                </div>
              )}

              <p className="text-xs text-[var(--muted)] text-center leading-relaxed">
                본 진단은 AI가 사진을 기반으로 추정한 참고용 결과이며,
                실제 색채 전문가의 대면 진단과 다를 수 있어요.
              </p>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
