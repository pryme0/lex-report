"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Landmark, Scale, ShieldCheck } from "lucide-react";
import { useAuthSession } from "@/lib/api/auth";

type AuthShellProps = {
  children: ReactNode;
  eyebrow: string;
  title: ReactNode;
  deck: string;
  statLabel: string;
  statValue: string;
  statNote: string;
  extended?: boolean;
};

export function AuthShell({
  children,
  eyebrow,
  title,
  deck,
  statLabel,
  statValue,
  statNote,
  extended = false,
}: AuthShellProps) {
  const router = useRouter();
  const session = useAuthSession();

  useEffect(() => {
    if (session.isAuthenticated) router.replace("/dashboard");
  }, [router, session.isAuthenticated]);

  if (session.isLoading || session.isAuthenticated) return null;

  return (
    <div className={`login-page login-page-signin${extended ? " login-page-auth-extended" : ""}`}>
      <main className="login-panel login-signin-panel">
        <header className="login-signin-header">
          <Link href="/" className="login-back-link"><ArrowLeft size={14} /> Back to LexTech Report</Link>
          <Link href="/" className="login-signin-brand" aria-label="LexTech Report home">
            <div className="sidebar-mark">Lr</div>
            <div>
              <div className="login-brand-name">LexTech Report</div>
              <div className="login-brand-sub">Nigerian legal intelligence</div>
            </div>
          </Link>
        </header>
        {children}
      </main>

      <aside className="login-aside login-signin-aside">
        <div className="login-aside-glow" />
        <div className="login-aside-copy">
          <p className="login-aside-kicker"><BadgeCheck size={14} /> {eyebrow}</p>
          <h2>{title}</h2>
          <p className="login-aside-deck">{deck}</p>
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
          <div className="login-stat-label">{statLabel}</div>
          <div className="login-stat-value">{statValue}</div>
          <span>{statNote}</span>
        </div>
      </aside>
    </div>
  );
}

export function AuthFormHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="login-form-heading">
      <p>{eyebrow}</p>
      <h1>{title}</h1>
      <span>{description}</span>
    </div>
  );
}

export function AuthSecurityNote() {
  return <div className="login-security-note"><ShieldCheck size={14} /> Encrypted session · Role-aware access</div>;
}
