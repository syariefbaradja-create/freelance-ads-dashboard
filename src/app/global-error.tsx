"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, Helvetica, sans-serif",
          background: "#f8fafc",
          padding: "1rem",
        }}
      >
        <div style={{ maxWidth: "24rem", textAlign: "center" }}>
          <div
            style={{
              margin: "0 auto 1rem",
              display: "flex",
              height: "2.75rem",
              width: "2.75rem",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "0.75rem",
              background: "#dc2626",
              color: "#fff",
              fontSize: "1.125rem",
              fontWeight: 700,
            }}
          >
            !
          </div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#0f172a" }}>
            Terjadi kesalahan
          </h1>
          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#64748b" }}>
            Maaf, aplikasi mengalami masalah yang tidak terduga. Coba muat
            ulang halaman ini.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: "1.5rem",
              borderRadius: "0.5rem",
              background: "#4f46e5",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 500,
              padding: "0.5rem 1rem",
              border: "none",
              cursor: "pointer",
            }}
          >
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  );
}
