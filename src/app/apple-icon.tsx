import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: "#0a0a0a",
          border: "4px solid #14F195",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 96,
          fontWeight: 900,
          color: "#14F195",
          fontFamily: "sans-serif",
        }}
      >
        B
      </div>
    ),
    { ...size }
  );
}
