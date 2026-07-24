import { ImageResponse } from "next/og";

export const alt = "Color Fit — AI 퍼스널컬러 진단";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SEASONS = [
  { gradient: "linear-gradient(150deg,#ffd9a0,#ff8a80)" },
  { gradient: "linear-gradient(150deg,#c5d9ff,#c8b8e8)" },
  { gradient: "linear-gradient(150deg,#e0b070,#8a5a30)" },
  { gradient: "linear-gradient(150deg,#7c90d8,#3f3d9e)" },
];

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f3ec",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", gap: 18, marginBottom: 56 }}>
          {SEASONS.map((s, i) => (
            <div
              key={i}
              style={{
                width: 96,
                height: 132,
                borderRadius: 24,
                background: s.gradient,
                transform: `rotate(${(i - 1.5) * 6}deg)`,
              }}
            />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 16,
          }}
        >
          <span style={{ fontSize: 76, fontStyle: "italic", color: "#211c17" }}>
            Color Fit
          </span>
          <span style={{ fontSize: 30, color: "#8c8378", letterSpacing: 4 }}>
            컬러핏
          </span>
        </div>
        <div style={{ fontSize: 28, color: "#b0794a", marginTop: 20, letterSpacing: 2 }}>
          AI 퍼스널컬러 진단
        </div>
      </div>
    ),
    { ...size }
  );
}
