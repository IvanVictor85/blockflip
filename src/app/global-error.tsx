"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// global-error substitui o layout inteiro — deve ser self-contained com <html>/<body>
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[BlockFlip] Critical global error:", {
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <html lang="pt-BR" className="dark">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420, padding: "0 24px" }}>
          <div
            style={{
              display: "inline-block",
              padding: "16px",
              borderRadius: "50%",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              marginBottom: 24,
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Erro crítico no BlockFlip
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 8, lineHeight: 1.6 }}>
            Seus dados estão seguros. Recarregue a aplicação para continuar.
          </p>
          {error.digest && (
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "monospace", marginBottom: 24 }}>
              Ref: {error.digest}
            </p>
          )}

          <button
            onClick={reset}
            style={{
              background: "#14F195",
              color: "#000",
              border: "none",
              borderRadius: 8,
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Recarregar
          </button>
        </div>
      </body>
    </html>
  );
}
