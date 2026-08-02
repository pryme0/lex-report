"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { useSignup } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/axios";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");

  const signup = useSignup();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setValidationError("");

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setValidationError("Password must be at least 8 characters");
      return;
    }

    signup.mutate({ name, email, password });
  }

  if (signup.isSuccess) {
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
            <h1>Check your email</h1>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: 24 }}>
              We&apos;ve sent a verification link to <strong>{email}</strong>.
              Please click the link to verify your account before signing in.
            </p>
            <Link href="/login" className="btn btn-primary" style={{ display: "inline-block", height: 44, lineHeight: "44px" }}>
              Return to login
            </Link>
          </div>
        </div>
        <div className="login-aside">
          <div>
            <p className="l-hero-eyebrow" style={{ color: "rgba(255,255,255,0.38)", marginBottom: 14 }}>
              Email verification
            </p>
            <h2>Secure your account with email verification for protected legal research.</h2>
          </div>
        </div>
      </div>
    );
  }

  const error = validationError || (signup.error ? getErrorMessage(signup.error) : "");

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
          <h1>Create account</h1>
          {error && <div className="form-error">{error}</div>}
          <div className="form-field">
            <label className="form-label" htmlFor="name">Full name</label>
            <input
              id="name"
              className="form-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="password">Password</label>
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
            <label className="form-label" htmlFor="confirmPassword">Confirm password</label>
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
            disabled={signup.isPending}
          >
            {signup.isPending ? <Loader2 className="animate-spin" size={18} /> : "Create account"}
          </button>
          <div className="form-footer">
            Already have an account?{" "}
            <Link href="/login" className="form-link">
              Log in
            </Link>
          </div>
        </form>
      </div>
      <div className="login-aside">
        <div>
          <p className="l-hero-eyebrow" style={{ color: "rgba(255,255,255,0.38)", marginBottom: 14 }}>
            Get started
          </p>
          <h2>Join thousands of legal professionals using LexReport for research and drafting.</h2>
        </div>
        <div className="login-stat">
          <div className="login-stat-label">Archive coverage</div>
          <div className="login-stat-value">50+ years of judgments</div>
        </div>
      </div>
    </div>
  );
}
