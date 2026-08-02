"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useSignin, useForgotPassword } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/axios";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetNote, setResetNote] = useState("");

  const signin = useSignin();
  const forgotPassword = useForgotPassword();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    signin.mutate({ email, password });
  }

  async function handleForgotPassword() {
    if (!email) {
      return;
    }
    forgotPassword.mutate(email, {
      onSuccess: () => {
        setResetNote(`If an account exists for ${email}, a password reset link has been sent.`);
      },
      onError: () => {
        setResetNote("Unable to send reset email. Please try again.");
      },
    });
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
          {signin.error && <div className="form-error">{getErrorMessage(signin.error)}</div>}
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
              disabled={forgotPassword.isPending}
            >
              Forgot password?
            </button>
          </div>
          {resetNote && <div className="form-note">{resetNote}</div>}
          <button
            className="btn btn-primary"
            type="submit"
            style={{ height: 44 }}
            disabled={signin.isPending}
          >
            {signin.isPending ? <Loader2 className="animate-spin" size={18} /> : "Log in"}
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
