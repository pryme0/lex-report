"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided");
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`${API_BASE}/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully");
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed");
        }
      } catch {
        setStatus("error");
        setMessage("Network error. Please try again.");
      }
    }

    verify();
  }, [token]);

  return (
    <div className="login-page">
      <div className="login-panel">
        <Link href="/" className="btn btn-link" style={{ alignSelf: "flex-start" }}>
          <ArrowLeft size={13} /> Back to site
        </Link>
        <div className="login-brand">
          <div className="sidebar-mark">Lr</div>
          <div>
            <div className="login-brand-name">LexReport</div>
            <div className="login-brand-sub">Secure legal intelligence workspace</div>
          </div>
        </div>
        <div className="login-form" style={{ textAlign: "center" }}>
          {status === "loading" && (
            <>
              <Loader2 size={64} className="animate-spin" style={{ color: "var(--color-primary)", marginBottom: 24 }} />
              <h1>Verifying your email...</h1>
              <p style={{ color: "var(--color-text-secondary)" }}>Please wait while we verify your email address.</p>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle size={64} style={{ color: "var(--color-success)", marginBottom: 24 }} />
              <h1>Email verified!</h1>
              <p style={{ color: "var(--color-text-secondary)", marginBottom: 24 }}>{message}</p>
              <Link href="/login" className="btn btn-primary" style={{ display: "inline-block", height: 44, lineHeight: "44px" }}>
                Sign in to your account
              </Link>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle size={64} style={{ color: "var(--color-error)", marginBottom: 24 }} />
              <h1>Verification failed</h1>
              <p style={{ color: "var(--color-text-secondary)", marginBottom: 24 }}>{message}</p>
              <Link href="/login" className="btn btn-secondary" style={{ display: "inline-block", height: 44, lineHeight: "44px" }}>
                Return to login
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="login-aside">
        <div>
          <p className="l-hero-eyebrow" style={{ color: "rgba(255,255,255,0.38)", marginBottom: 14 }}>
            Email verification
          </p>
          <h2>Secure your account with verified email access to legal research tools.</h2>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="login-page">
        <div className="login-panel" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader2 size={48} className="animate-spin" />
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
