"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [note, setNote] = useState("");

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    sessionStorage.setItem("lr-auth", "1");
    router.push("/dashboard");
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
          <div className="form-field">
            <label className="form-label" htmlFor="email">Email</label>
            <input id="email" className="form-input" type="email" defaultValue="partner@lawfirm.ng" required />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="password">Password</label>
            <input id="password" className="form-input" type="password" defaultValue="lexreport" required />
          </div>
          <div className="form-row">
            <label className="form-check">
              <input type="checkbox" defaultChecked /> Remember this device
            </label>
            <button type="button" className="btn btn-link" onClick={() => setNote("Reset instructions sent to partner@lawfirm.ng.")}>
              Forgot password?
            </button>
          </div>
          {note && <div className="form-note">{note}</div>}
          <button className="btn btn-primary" type="submit" style={{ height: 44 }}>
            Log in to workspace
          </button>
        </form>
      </div>
      <div className="login-aside">
        <div>
          <p className="l-hero-eyebrow" style={{ color: "rgba(255,255,255,0.38)", marginBottom: 14 }}>Role-aware access</p>
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
