"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
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
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 24,
      }}
    >
      <AlertTriangle size={36} style={{ color: "var(--color-error, #9a3244)", marginBottom: 16 }} />
      <div style={{ fontSize: "1.0625rem", fontWeight: 600, marginBottom: 8 }}>
        This screen hit a snag
      </div>
      <p style={{ fontSize: "0.875rem", color: "var(--color-muted)", maxWidth: 380, marginBottom: 24 }}>
        Something went wrong loading this view. Your session and navigation are unaffected.
      </p>
      <button type="button" onClick={() => reset()} className="btn btn-primary">
        Try again
      </button>
    </div>
  );
}
