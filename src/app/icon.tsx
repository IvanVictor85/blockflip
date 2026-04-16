import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "#14F195",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          fontWeight: 900,
          color: "#000",
          fontFamily: "sans-serif",
        }}
      >
        B
      </div>
    ),
    { ...size }
  );
}
