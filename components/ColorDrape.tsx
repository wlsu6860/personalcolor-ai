"use client";

import { useState } from "react";

interface DrapeColor {
  hex: string;
  name: string;
}

/**
 * 실제 대면 퍼스널컬러 컨설팅에서 하는 "컬러 드레이핑"(얼굴 옆에 천을 대보는 것)을
 * 화면으로 재현한다. 색 스와치를 텍스트로 나열하는 대신, 사용자의 실제 사진 옆에
 * 나란히 대보는 형태로 보여줘서 "이 색을 입으면 이런 느낌"을 직관적으로 전달한다.
 */
export default function ColorDrape({
  photoUrl,
  colors,
  lockedCount = 0,
}: {
  photoUrl: string | null;
  colors: DrapeColor[];
  lockedCount?: number;
}) {
  const [active, setActive] = useState(0);
  const activeColor = colors[active];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center overflow-x-auto py-2 -my-2">
        <div className="relative w-24 h-24 rounded-full overflow-hidden shrink-0 border-2 border-[var(--card)] shadow-lg z-10">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt="내 사진"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[var(--line)]" />
          )}
        </div>

        <div className="flex items-center -ml-3 pr-2">
          {colors.map((c, i) => {
            const isActive = i === active;
            return (
              <button
                key={c.hex}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`${c.name} 드레이핑 보기`}
                className="rounded-xl shrink-0 transition-all duration-300 border-2 border-[var(--card)]"
                style={{
                  background: c.hex,
                  width: isActive ? 52 : 40,
                  height: isActive ? 84 : 66,
                  marginLeft: i === 0 ? 0 : -16,
                  zIndex: isActive ? 10 : colors.length - i,
                  transform: isActive ? "translateY(-10px)" : "none",
                  boxShadow: isActive
                    ? `0 10px 20px -6px ${c.hex}aa`
                    : "0 2px 6px -2px rgba(0,0,0,0.15)",
                }}
              />
            );
          })}
          {Array.from({ length: lockedCount }).map((_, i) => (
            <div
              key={`locked-${i}`}
              className="rounded-xl shrink-0 border-2 border-[var(--card)] blur-[2px] opacity-40"
              style={{
                background: "var(--line)",
                width: 40,
                height: 66,
                marginLeft: -16,
                zIndex: 1,
              }}
            />
          ))}
        </div>
      </div>

      {activeColor && (
        <div>
          <p className="text-[11px] text-[var(--muted)] mb-0.5">
            이 컬러를 입으면 —
          </p>
          <p className="font-serif-kr font-semibold text-sm">
            {activeColor.name}
          </p>
        </div>
      )}

      {colors.length > 1 && (
        <p className="text-[11px] text-[var(--muted)]">
          스와치를 눌러보면 다른 컬러도 대볼 수 있어요
        </p>
      )}
    </div>
  );
}
