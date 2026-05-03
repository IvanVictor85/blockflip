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
          background: "#0D0E10",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="24" height="26" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
          <g stroke="#F0EDE5" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round">
            <polygon points="20,80 100,120 180,80 180,160 100,200 20,160" fill="none"/>
            <line x1="100" y1="120" x2="100" y2="200"/>
            <polygon points="20,80 100,20 180,80 100,120" fill="#F0EDE5"/>
          </g>
        </svg>
      </div>
    ),
    { ...size }
  );
}
