"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Mail, MailCheck } from "lucide-react";
import { AuthFormHeading, AuthSecurityNote, AuthShell } from "@/components/AuthShell";
import { useForgotPassword } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/axios";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotPasswordContent() {
  const prefilled = useSearchParams().get("email") ?? "";
  const [email, setEmail] = useState(prefilled);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [validationError, setValidationError] = useState("");
  const forgotPassword = useForgotPassword();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");

    const trimmed = email.trim();
    if (!trimmed) {
      setValidationError("Enter the email address on your account.");
      return;
    }
    if (!EMAIL_RE.test(trimmed)) {
      setValidationError("Enter a valid email address.");
      return;
    }

    forgotPassword.mutate(trimmed, {
      onSuccess: () => setSentTo(trimmed),
    });
  }

  if (sentTo) {
    return (
      <AuthShell
        eyebrow="Account recovery"
        title={<>Check your inbox<br />to continue.</>}
        deck="Reset links are single-use and expire after one hour, so a lost link never leaves an account exposed."
        statLabel="Recovery status"
        statValue="Email sent"
        statNote="Link expires in 1 hour"
      >
        <div className="login-form login-signin-form login-status-card">
          <MailCheck size={42} />
          <AuthFormHeading
            eyebrow="Reset link sent"
            title="Check your email."
            description={`If an account exists for ${sentTo}, a password reset link is on its way. It expires in one hour.`}
          />
          <button
            type="button"
            className="btn btn-secondary login-submit"
            onClick={() => setSentTo(null)}
            disabled={forgotPassword.isPending}
          >
            Use a different email
          </button>
          <div className="form-footer">
            Didn&apos;t receive it? Check your spam folder, or{" "}
            <button
              type="button"
              className="form-link login-inline-link"
              onClick={() => forgotPassword.mutate(sentTo)}
              disabled={forgotPassword.isPending}
            >
              {forgotPassword.isPending ? "sending…" : "send it again"}
            </button>
            .
          </div>
          <Link href="/login" className="login-back-inline">
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  const error =
    validationError || (forgotPassword.error ? getErrorMessage(forgotPassword.error) : "");

  return (
    <AuthShell
      eyebrow="Account recovery"
      title={<>Regain access<br />to your research desk.</>}
      deck="We email a single-use link so your saved authorities, matters and drafts stay protected."
      statLabel="Recovery status"
      statValue="Secure reset"
      statNote="Single-use link, 1 hour expiry"
    >
      <form className="login-form login-signin-form" onSubmit={submit}>
        <AuthFormHeading
          eyebrow="Forgot password"
          title="Reset your password."
          description="Enter the email on your account and we'll send a link to choose a new password."
        />
        {error && <div className="form-error">{error}</div>}
        <div className="form-field">
          <label className="form-label" htmlFor="email">Email</label>
          <div className="login-input-wrap">
            <Mail size={16} />
            <input
              id="email"
              className="form-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@chambers.com"
              required
              autoFocus
              autoComplete="email"
            />
          </div>
        </div>
        <button
          className="btn btn-primary login-submit"
          type="submit"
          disabled={forgotPassword.isPending}
        >
          {forgotPassword.isPending ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>Send reset link <ArrowRight size={15} /></>
          )}
        </button>
        <div className="form-footer">
          Remembered it?{" "}
          <Link href="/login" className="form-link">Back to sign in</Link>
        </div>
        <AuthSecurityNote />
      </form>
    </AuthShell>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
