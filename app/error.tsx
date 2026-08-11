"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 24,
        fontFamily: "var(--font-sans)",
        color: "var(--color-body)",
      }}
    >
      <AlertTriangle size={40} style={{ color: "var(--color-error, #9a3244)", marginBottom: 16 }} />
      <div style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: 8 }}>
        Something went wrong
      </div>
      <p style={{ fontSize: "0.875rem", color: "var(--color-muted)", maxWidth: 380, marginBottom: 24 }}>
        An unexpected error occurred. You can try again, or head back to the homepage.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button type="button" onClick={() => reset()} className="btn btn-primary">
          Try again
        </button>
        <Link href="/" className="btn btn-secondary">
          Return home
        </Link>
      </div>
    </div>
  );
}
