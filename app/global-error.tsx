"use client";

import { useEffect } from "react";

// Replaces the root layout on catastrophic errors — must render its own
// <html>/<body>. Inline styles only; globals.css and the font variable are not
// available here.
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
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "2rem 3rem",
          background: "#ffffff",
          color: "#3c3c3c",
          fontFamily: "ui-rounded, system-ui, sans-serif",
        }}
      >
        <p style={{ fontSize: "clamp(5rem,20vw,14rem)", fontWeight: 900, lineHeight: 1, color: "#e5e5e5", userSelect: "none", margin: 0 }}>
          500
        </p>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "1rem 0 0.5rem", letterSpacing: "-0.02em" }}>
          Something went wrong
        </h1>
        <p style={{ margin: 0, color: "#777777", maxWidth: "38ch" }}>
          A critical error occurred. Please try refreshing the page.
        </p>
        {error.digest && (
          <p style={{ marginTop: "0.75rem", fontFamily: "monospace", fontSize: "0.75rem", color: "#afafaf" }}>
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            marginTop: "2rem",
            alignSelf: "flex-start",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.25rem",
            borderRadius: "1rem",
            background: "#ff9600",
            color: "#ffffff",
            border: "2px solid #e5e5e5",
            boxShadow: "0 4px 0 0 #e5e5e5",
            fontSize: "0.875rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
