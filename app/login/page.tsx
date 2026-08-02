"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3001/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetNote, setResetNote] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Sign in failed");
        setLoading(false);
        return;
      }

      sessionStorage.setItem("lr-auth", "1");
      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }

    try {
      await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResetNote(`If an account exists for ${email}, a password reset link has been sent.`);
    } catch {
      setResetNote("Unable to send reset email. Please try again.");
    }
  }

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
          <h1>Log in</h1>
          {error && <div className="form-error">{error}</div>}
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
              autoComplete="current-password"
            />
          </div>
          <div className="form-row">
            <label className="form-check">
              <input type="checkbox" defaultChecked /> Remember this device
            </label>
            <button
              type="button"
              className="btn btn-link"
              onClick={handleForgotPassword}
            >
              Forgot password?
            </button>
          </div>
          {resetNote && <div className="form-note">{resetNote}</div>}
          <button
            className="btn btn-primary"
            type="submit"
            style={{ height: 44 }}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Log in"}
          </button>
          <div className="form-footer">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="form-link">
              Sign up
            </Link>
          </div>
        </form>
      </div>
      <div className="login-aside">
        <div>
          <p className="l-hero-eyebrow" style={{ color: "rgba(255,255,255,0.38)", marginBottom: 14 }}>
            Role-aware access
          </p>
          <h2>Partner, associate, researcher, editor, and client-reader permissions.</h2>
        </div>
        <div className="login-stat">
          <div className="login-stat-label">Last editorial sync</div>
          <div className="login-stat-value">2,481 updates indexed</div>
        </div>
      </div>
    </div>
  );
}
