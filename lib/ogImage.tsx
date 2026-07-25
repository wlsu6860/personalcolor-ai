// Next.js의 opengraph-image 파일 컨벤션은 라우트 세그먼트별로 각각 정의해야
// 적용된다 — 상위(app/)에 하나만 있어도 /blog, /diagnose 같은 하위 세그먼트에는
// 자동으로 상속되지 않는다. 그래서 세그먼트마다 opengraph-image.tsx 파일을 두되,
// 공통 브랜드 비주얼은 이 헬퍼 하나로 통일해서 중복을 줄인다.
export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

const SEASON_GRADIENTS = [
  "linear-gradient(150deg,#ffd9a0,#ff8a80)",
  "linear-gradient(150deg,#c5d9ff,#c8b8e8)",
  "linear-gradient(150deg,#e0b070,#8a5a30)",
  "linear-gradient(150deg,#7c90d8,#3f3d9e)",
];

export function buildBrandOgImage(subtitle: string) {
  return (
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
        {SEASON_GRADIENTS.map((gradient, i) => (
          <div
            key={i}
            style={{
              width: 96,
              height: 132,
              borderRadius: 24,
              background: gradient,
              transform: `rotate(${(i - 1.5) * 6}deg)`,
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
        <span style={{ fontSize: 76, fontStyle: "italic", color: "#211c17" }}>
          Color Fit
        </span>
        <span style={{ fontSize: 30, color: "#8c8378", letterSpacing: 4 }}>
          컬러핏
        </span>
      </div>
      <div
        style={{
          fontSize: 28,
          color: "#b0794a",
          marginTop: 20,
          letterSpacing: 2,
          maxWidth: 900,
          textAlign: "center",
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}
