import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#211c17",
          borderRadius: 7,
        }}
      >
        <span
          style={{
            fontSize: 22,
            fontStyle: "italic",
            fontFamily: "serif",
            color: "#cf9a67",
          }}
        >
          C
        </span>
      </div>
    ),
    { ...size }
  );
}
