"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ background: "#070f24", color: "#E8EAFF", fontFamily: "sans-serif", display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ marginBottom: 16 }}>Algo correu mal</h2>
          <p style={{ color: "#8B90B8", marginBottom: 24 }}>{error.message}</p>
          <button
            onClick={reset}
            style={{ padding: "8px 24px", background: "#C026D3", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
