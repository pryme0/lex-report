"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, BadgeCheck, Eye, EyeOff, Landmark, Loader2, LockKeyhole, Mail, Scale, ShieldCheck } from "lucide-react";
import { useSignin } from "@/lib/api/auth";
import { useAuthSession } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/axios";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const session = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const signin = useSignin();

  useEffect(() => {
    if (session.isAuthenticated) router.replace("/dashboard");
  }, [router, session.isAuthenticated]);

  const forgotPasswordHref = email.trim()
    ? `/forgot-password?email=${encodeURIComponent(email.trim())}`
    : "/forgot-password";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    signin.mutate({ email, password });
  }

  if (session.isLoading || session.isAuthenticated) return null;

  return (
    <div className="login-page login-page-signin">
      <main className="login-panel login-signin-panel">
        <header className="login-signin-header">
          <Link href="/" className="login-back-link">
            <ArrowLeft size={14} /> Back to LexReport
          </Link>
          <Link href="/" className="login-signin-brand" aria-label="LexReport home">
            <div className="sidebar-mark">Lr</div>
            <div>
              <div className="login-brand-name">LexReport</div>
              <div className="login-brand-sub">Nigerian legal intelligence</div>
            </div>
          </Link>
        </header>

        <form className="login-form login-signin-form" onSubmit={submit}>
          <div className="login-form-heading">
            <p>Secure workspace</p>
            <h1>Welcome back.</h1>
            <span>Sign in to continue your research, matters and saved authorities.</span>
          </div>
          {signin.error && <div className="form-error">{getErrorMessage(signin.error)}</div>}
          <div className="form-field">
            <label className="form-label" htmlFor="email">Email</label>
            <div className="login-input-wrap">
              <Mail size={16} />
              <input
                id="email"
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@chambers.com"
                required
                autoComplete="email"
              />
            </div>
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="login-input-wrap">
              <LockKeyhole size={16} />
              <input
                id="password"
                className="form-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="form-row">
            <label className="form-check">
              <input type="checkbox" defaultChecked /> Remember this device
            </label>
            <Link className="btn btn-link" href={forgotPasswordHref}>
              Forgot password?
            </Link>
          </div>
          <button
            className="btn btn-primary login-submit"
            type="submit"
            disabled={signin.isPending}
          >
            {signin.isPending ? <Loader2 className="animate-spin" size={18} /> : <>Enter research desk <ArrowRight size={15} /></>}
          </button>
          <div className="form-footer">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="form-link">
              Sign up
            </Link>
          </div>
          <div className="login-security-note"><ShieldCheck size={14} /> Encrypted session · Role-aware access</div>
        </form>
      </main>

      <aside className="login-aside login-signin-aside">
        <div className="login-aside-glow" />
        <div className="login-aside-copy">
          <p className="login-aside-kicker"><BadgeCheck size={14} /> Verified legal research</p>
          <h2>Your authorities.<br />Your matters.<br />One research desk.</h2>
          <p className="login-aside-deck">Return to structured Nigerian law reports, live citation treatment and the research record behind every active matter.</p>
          <div className="login-aside-standards">
            <span><Scale size={16} /><strong>Ratio verified</strong><small>Report-first legal analysis</small></span>
            <span><Landmark size={16} /><strong>National coverage</strong><small>Appellate and specialist courts</small></span>
            <span><ShieldCheck size={16} /><strong>Workspace secure</strong><small>Access matched to your role</small></span>
          </div>
        </div>
        <div className="login-justice-frame">
          <Image
            src="/images/lady-justice-engraving.png"
            alt="Lady Justice holding balanced scales"
            width={1024}
            height={1366}
            priority
            sizes="(max-width: 1080px) 0px, 45vw"
          />
          <div className="login-justice-caption"><Scale size={14} /> Law, clearly reported</div>
        </div>
        <div className="login-stat">
          <div className="login-stat-label">Editorial archive</div>
          <div className="login-stat-value">2,481 updates indexed</div>
          <span>Last synchronised today</span>
        </div>
      </aside>
    </div>
  );
}
