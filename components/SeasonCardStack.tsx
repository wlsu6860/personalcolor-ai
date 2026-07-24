"use client";

import { useRef } from "react";

const SEASONS = [
  {
    en: "Spring",
    ko: "봄 웜톤",
    gradient: "linear-gradient(150deg,#ffd9a0 0%,#ffab91 55%,#ff8a80 100%)",
    tilt: "-6deg",
    depth: 0.6,
  },
  {
    en: "Summer",
    ko: "여름 쿨톤",
    gradient: "linear-gradient(150deg,#c5d9ff 0%,#a8c8f0 55%,#c8b8e8 100%)",
    tilt: "4deg",
    depth: 1,
  },
  {
    en: "Autumn",
    ko: "가을 웜톤",
    gradient: "linear-gradient(150deg,#e0b070 0%,#b97a45 55%,#8a5a30 100%)",
    tilt: "-3deg",
    depth: 0.8,
  },
  {
    en: "Winter",
    ko: "겨울 쿨톤",
    gradient: "linear-gradient(150deg,#7c90d8 0%,#5e60ce 55%,#3f3d9e 100%)",
    tilt: "5deg",
    depth: 1.2,
  },
];

const POSITIONS = [
  { top: 0, left: 0 },
  { top: 30, left: 190 },
  { top: 130, left: 40 },
  { top: 160, left: 230 },
];

// 패럴랙스 이동은 바깥 wrapper에, 둥둥 뜨는 float 애니메이션은 안쪽 카드에 —
// 같은 엘리먼트에 둘 다 두면 CSS 애니메이션이 transform을 계속 덮어써서
// 마우스 반응이 안 먹힌다. 레이어를 나눠서 둘 다 살린다.
export default function SeasonCardStack() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRefs = useRef<(HTMLDivElement | null)[]>([]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;

    wrapperRefs.current.forEach((el, i) => {
      if (!el) return;
      const depth = SEASONS[i].depth;
      el.style.setProperty("--parallax-x", `${relX * 18 * depth}px`);
      el.style.setProperty("--parallax-y", `${relY * 18 * depth}px`);
    });
  }

  function handleMouseLeave() {
    wrapperRefs.current.forEach((el) => {
      if (!el) return;
      el.style.setProperty("--parallax-x", "0px");
      el.style.setProperty("--parallax-y", "0px");
    });
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="fade-up delay-3 relative h-105 hidden lg:block"
    >
      {SEASONS.map((s, i) => (
        <div
          key={s.en}
          ref={(el) => {
            wrapperRefs.current[i] = el;
          }}
          className="tilt-card absolute w-52 h-64"
          style={{
            top: `${POSITIONS[i].top}px`,
            left: `${POSITIONS[i].left}px`,
            zIndex: i + 1,
            transform:
              "translate(var(--parallax-x, 0px), var(--parallax-y, 0px))",
          }}
        >
          <div
            className="season-card w-full h-full rounded-3xl p-6 flex flex-col justify-between text-white cursor-default"
            style={{
              background: s.gradient,
              ["--tilt" as string]: s.tilt,
              animationDelay: `${i * 0.9}s`,
            }}
          >
            <span className="font-display italic text-xl drop-shadow-sm">
              {s.en}
            </span>
            <div>
              <div className="flex gap-1.5 mb-3">
                {[0.95, 0.75, 0.55].map((o) => (
                  <span
                    key={o}
                    className="w-4 h-4 rounded-full bg-white"
                    style={{ opacity: o * 0.5 }}
                  />
                ))}
              </div>
              <span className="text-sm font-medium drop-shadow-sm">
                {s.ko}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
