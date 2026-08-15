"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1c1917, #292524)",
          color: "#fafaf9",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ width: "100%", maxWidth: 480, padding: "0 24px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ color: "#a8a29e", margin: 0, lineHeight: 1.6, fontSize: 14 }}>
            The app hit an unexpected error while loading
            {error?.digest ? ` (${error.digest})` : ""}. This is usually a
            temporary problem or a configuration issue. Reload the page or try
            again.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 24,
              background: "#ea580c",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 14,
              border: "none",
              borderRadius: 12,
              padding: "12px 28px",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}