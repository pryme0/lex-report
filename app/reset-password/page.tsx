"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, CheckCircle, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { AuthFormHeading, AuthSecurityNote, AuthShell } from "@/components/AuthShell";
import { useResetPassword } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/axios";

function ResetPasswordContent() {
  const token = useSearchParams().get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState("");
  const resetPassword = useResetPassword();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");
    if (!token) return setValidationError("No reset token provided");
    if (password !== confirmPassword) return setValidationError("Passwords do not match");
    if (password.length < 8) return setValidationError("Password must be at least 8 characters");
    resetPassword.mutate({ token, password });
  }

  if (resetPassword.isSuccess) {
    return (
      <AuthShell eyebrow="Account security" title={<>Your workspace<br />is secure again.</>} deck="Your research, saved authorities and matter history remain protected." statLabel="Security status" statValue="Password updated" statNote="You can now sign in">
        <div className="login-form login-signin-form login-status-card">
          <CheckCircle size={42} />
          <AuthFormHeading eyebrow="Password updated" title="Reset complete." description="Your new password is active and your workspace is ready." />
          <Link href="/login" className="btn btn-primary login-submit">Sign in now <ArrowRight size={15} /></Link>
        </div>
      </AuthShell>
    );
  }

  if (!token) {
    return (
      <AuthShell eyebrow="Account security" title={<>Protected access<br />starts with a valid link.</>} deck="Reset links expire to prevent unauthorised access to legal research workspaces." statLabel="Security status" statValue="Link unavailable" statNote="Request a new reset email">
        <div className="login-form login-signin-form login-status-card login-status-error">
          <AlertCircle size={42} />
          <AuthFormHeading eyebrow="Invalid link" title="Request a new link." description="This password reset link is invalid or has expired." />
          <Link href="/login" className="btn btn-secondary login-submit">Return to login</Link>
        </div>
      </AuthShell>
    );
  }

  const error = validationError || (resetPassword.error ? getErrorMessage(resetPassword.error) : "");
  return (
    <AuthShell eyebrow="Account security" title={<>Protect the research<br />behind every matter.</>} deck="Choose a strong password to keep saved authorities, notes and client matters secure." statLabel="Secure access" statValue="Encrypted workspace" statNote="Role-aware authentication">
      <form className="login-form login-signin-form" onSubmit={submit}>
        <AuthFormHeading eyebrow="Account recovery" title="Choose a new password." description="Use at least eight characters and avoid a password used elsewhere." />
        {error && <div className="form-error">{error}</div>}
        <div className="form-field">
          <label className="form-label" htmlFor="password">New password</label>
          <div className="login-input-wrap"><LockKeyhole size={16} /><input id="password" className="form-input" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimum 8 characters" required minLength={8} autoComplete="new-password" /></div>
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="confirmPassword">Confirm new password</label>
          <div className="login-input-wrap"><LockKeyhole size={16} /><input id="confirmPassword" className="form-input" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat new password" required autoComplete="new-password" /><button type="button" className="login-password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide passwords" : "Show passwords"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
        </div>
        <button className="btn btn-primary login-submit" type="submit" disabled={resetPassword.isPending}>{resetPassword.isPending ? <Loader2 className="animate-spin" size={18} /> : <>Update password <ArrowRight size={15} /></>}</button>
        <AuthSecurityNote />
      </form>
    </AuthShell>
  );
}

function ResetFallback() {
  return (
    <AuthShell eyebrow="Account security" title={<>Secure access to<br />your research desk.</>} deck="We are preparing the protected password reset flow." statLabel="Security status" statValue="Checking link" statNote="This takes only a moment">
      <div className="login-form login-signin-form login-status-card"><Loader2 size={42} className="animate-spin" /><AuthFormHeading eyebrow="Please wait" title="Checking your link." description="We are validating this password reset request." /></div>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<ResetFallback />}><ResetPasswordContent /></Suspense>;
}
