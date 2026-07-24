"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

const AD_DURATION_SEC = 15;
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type GateStatus = "idle" | "watching" | "unlocked";

/**
 * "15초 광고를 보면 심화 소견을 더 보여준다" 보상형 게이트.
 *
 * AdSense 발행자 ID(NEXT_PUBLIC_ADSENSE_CLIENT_ID)가 환경변수에 없으면
 * 실제 구글 스크립트는 아예 로드하지 않고 "광고 준비 중" 플레이스홀더만 보여준다 —
 * 잘못된 값으로 스크립트를 미리 심어두면 콘솔 에러나 정책 문제가 생길 수 있어서다.
 * 나중에 대표님이 발급받은 ID를 넣으면 코드 수정 없이 바로 실제 광고가 뜬다.
 */
export default function AdRewardGate({
  unlockedContent,
}: {
  unlockedContent: React.ReactNode;
}) {
  const [status, setStatus] = useState<GateStatus>("idle");
  const [countdown, setCountdown] = useState(AD_DURATION_SEC);
  const adPushed = useRef(false);

  useEffect(() => {
    if (status !== "watching") return;
    if (countdown <= 0) {
      setStatus("unlocked");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [status, countdown]);

  useEffect(() => {
    if (status !== "watching" || !ADSENSE_CLIENT || adPushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      adPushed.current = true;
    } catch {
      // 광고 로드 실패해도 카운트다운/보상 로직에는 영향 없게 조용히 무시
    }
  }, [status]);

  if (status === "unlocked") {
    return (
      <div className="card-surface rounded-2xl p-7">
        <h3 className="font-serif-kr font-semibold mb-3">심화 컨설팅 소견</h3>
        {unlockedContent}
        <p className="text-xs text-[var(--accent)] mt-4">
          ✓ 광고 시청으로 무료 공개됐어요
        </p>
      </div>
    );
  }

  return (
    <div className="card-surface rounded-2xl p-6">
      <h3 className="font-serif-kr font-semibold mb-1">심화 소견 더 보기</h3>
      <p className="text-xs text-[var(--muted)] mb-4">
        짧은 광고 하나 보시면, 전문가 심화 코멘터리를 무료로 열어드려요
      </p>

      {status === "idle" && (
        <button
          type="button"
          onClick={() => {
            setCountdown(AD_DURATION_SEC);
            setStatus("watching");
          }}
          className="btn-primary w-full font-medium py-3.5 rounded-full text-sm tracking-wide"
        >
          📺 {AD_DURATION_SEC}초 광고 보고 심화 소견 열기
        </button>
      )}

      {status === "watching" && (
        <div>
          {ADSENSE_CLIENT && (
            <Script
              async
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
              crossOrigin="anonymous"
              strategy="afterInteractive"
            />
          )}
          <div className="rounded-xl overflow-hidden bg-[var(--background)] min-h-28 flex items-center justify-center border hairline">
            {ADSENSE_CLIENT && ADSENSE_SLOT ? (
              <ins
                className="adsbygoogle"
                style={{ display: "block", width: "100%" }}
                data-ad-client={ADSENSE_CLIENT}
                data-ad-slot={ADSENSE_SLOT}
                data-ad-format="auto"
                data-full-width-responsive="true"
              />
            ) : (
              <p className="text-xs text-[var(--muted)] px-4 text-center">
                광고 준비 중이에요 · 잠시 후 자동으로 열립니다
              </p>
            )}
          </div>
          <p className="text-xs text-center text-[var(--muted)] mt-3 tabular-nums">
            {countdown}초 후 자동으로 열립니다...
          </p>
        </div>
      )}
    </div>
  );
}
