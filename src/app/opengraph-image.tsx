import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "BlockFlip — High-Alpha RWA on Solana. Property Flipping. 20-30% ROI.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Grid overlay decorativo */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(20,241,149,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(20,241,149,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Glow top-right */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(20,241,149,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, zIndex: 1 }}>
          {/* Logo mark */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#14F195",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 900,
              color: "#000",
            }}
          >
            B
          </div>
          <span style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>BlockFlip</span>
          <div
            style={{
              marginLeft: 8,
              padding: "4px 12px",
              borderRadius: 100,
              border: "1px solid rgba(20,241,149,0.4)",
              background: "rgba(20,241,149,0.1)",
              fontSize: 13,
              color: "#14F195",
              fontWeight: 600,
            }}
          >
            Solana RWA
          </div>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, zIndex: 1 }}>
          <div style={{ fontSize: 56, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>
            Compra em leilão.{" "}
            <span style={{ color: "#14F195" }}>Reforma.</span>{" "}
            Vende com ágio.
          </div>
          <div style={{ fontSize: 22, color: "rgba(255,255,255,0.6)", maxWidth: 720 }}>
            Property Flipping tokenizado on-chain. Proof of Build verificável.
            SPE custódia garantida. Investimento mínimo $50 USDC.
          </div>
        </div>

        {/* Footer stats */}
        <div style={{ display: "flex", gap: 48, zIndex: 1 }}>
          {[
            { label: "ROI Alvo", value: "20-30%" },
            { label: "Ciclo Máximo", value: "6 meses" },
            { label: "Blockchain", value: "Solana" },
            { label: "Custódia", value: "SPE on-chain" },
          ].map((stat) => (
            <div key={stat.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1 }}>
                {stat.label}
              </span>
              <span style={{ fontSize: 22, fontWeight: 700, color: "#14F195" }}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
