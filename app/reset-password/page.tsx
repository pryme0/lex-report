"use client";

import { FormEvent, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { useResetPassword } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/axios";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");

  const resetPassword = useResetPassword();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setValidationError("");

    if (!token) {
      setValidationError("No reset token provided");
      return;
    }

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setValidationError("Password must be at least 8 characters");
      return;
    }

    resetPassword.mutate({ token, password });
  }

  if (resetPassword.isSuccess) {
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
            <CheckCircle size={64} style={{ color: "var(--color-success)", marginBottom: 24 }} />
            <h1>Password reset!</h1>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: 24 }}>
              Your password has been successfully reset. Redirecting to login...
            </p>
            <Link href="/login" className="btn btn-primary" style={{ display: "inline-block", height: 44, lineHeight: "44px" }}>
              Sign in now
            </Link>
          </div>
        </div>
        <div className="login-aside">
          <div>
            <p className="l-hero-eyebrow" style={{ color: "rgba(255,255,255,0.38)", marginBottom: 14 }}>
              Account security
            </p>
            <h2>Your password has been updated. Keep your legal research secure.</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
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
            <h1>Invalid reset link</h1>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: 24 }}>
              This password reset link is invalid or has expired.
            </p>
            <Link href="/login" className="btn btn-secondary" style={{ display: "inline-block", height: 44, lineHeight: "44px" }}>
              Return to login
            </Link>
          </div>
        </div>
        <div className="login-aside" />
      </div>
    );
  }

  const error = validationError || (resetPassword.error ? getErrorMessage(resetPassword.error) : "");

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
        <form className="login-form" onSubmit={submit}>
          <h1>Reset password</h1>
          {error && <div className="form-error">{error}</div>}
          <div className="form-field">
            <label className="form-label" htmlFor="password">New password</label>
            <input
              id="password"
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <span className="form-hint">Minimum 8 characters</span>
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="confirmPassword">Confirm new password</label>
            <input
              id="confirmPassword"
              className="form-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <button
            className="btn btn-primary"
            type="submit"
            style={{ height: 44 }}
            disabled={resetPassword.isPending}
          >
            {resetPassword.isPending ? <Loader2 className="animate-spin" size={18} /> : "Reset password"}
          </button>
        </form>
      </div>
      <div className="login-aside">
        <div>
          <p className="l-hero-eyebrow" style={{ color: "rgba(255,255,255,0.38)", marginBottom: 14 }}>
            Account security
          </p>
          <h2>Choose a strong password to protect your legal research workspace.</h2>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="login-page">
        <div className="login-panel" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader2 size={48} className="animate-spin" />
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
