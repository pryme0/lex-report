"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, Eye, EyeOff, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { AuthFormHeading, AuthSecurityNote, AuthShell } from "@/components/AuthShell";
import { useSignup } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/axios";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState("");
  const signup = useSignup();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");
    if (password !== confirmPassword) return setValidationError("Passwords do not match");
    if (password.length < 8) return setValidationError("Password must be at least 8 characters");
    signup.mutate({ name, email, password });
  }

  if (signup.isSuccess) {
    return (
      <AuthShell eyebrow="Email verification" title={<>Your secure research<br />workspace is ready.</>} deck="Verify your email to protect saved authorities, matters and research history." statLabel="Account security" statValue="Verification required" statNote="Check your inbox to continue">
        <div className="login-form login-signin-form login-status-card">
          <CheckCircle size={42} />
          <AuthFormHeading eyebrow="One final step" title="Check your email." description={`We sent a verification link to ${email}.`} />
          <p>Open the link in the email before signing in to your new LexReport workspace.</p>
          <Link href="/login" className="btn btn-primary login-submit">Return to login <ArrowRight size={15} /></Link>
        </div>
      </AuthShell>
    );
  }

  const error = validationError || (signup.error ? getErrorMessage(signup.error) : "");

  return (
    <AuthShell extended eyebrow="Create your workspace" title={<>Start with verified<br />authority.</>} deck="Build a secure research record around every matter, from first question to final bundle." statLabel="Archive coverage" statValue="50+ years of judgments" statNote="Continuously updated">
      <form className="login-form login-signin-form login-extended-form" onSubmit={submit}>
        <AuthFormHeading eyebrow="Create account" title="Join LexReport." description="Set up your secure legal research workspace." />
        {error && <div className="form-error">{error}</div>}

        <div className="form-field">
          <label className="form-label" htmlFor="name">Full name</label>
          <div className="login-input-wrap"><UserRound size={16} /><input id="name" className="form-input" type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" required autoComplete="name" /></div>
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="email">Email</label>
          <div className="login-input-wrap"><Mail size={16} /><input id="email" className="form-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@chambers.com" required autoComplete="email" /></div>
        </div>
        <div className="login-password-grid">
          <div className="form-field">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="login-input-wrap"><LockKeyhole size={16} /><input id="password" className="form-input" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimum 8 characters" required minLength={8} autoComplete="new-password" /></div>
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="confirmPassword">Confirm password</label>
            <div className="login-input-wrap"><LockKeyhole size={16} /><input id="confirmPassword" className="form-input" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat password" required autoComplete="new-password" /><button type="button" className="login-password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide passwords" : "Show passwords"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
          </div>
        </div>

        <button className="btn btn-primary login-submit" type="submit" disabled={signup.isPending}>{signup.isPending ? <Loader2 className="animate-spin" size={18} /> : <>Create secure workspace <ArrowRight size={15} /></>}</button>
        <div className="form-footer">Already have an account? <Link href="/login" className="form-link">Log in</Link></div>
        <AuthSecurityNote />
      </form>
    </AuthShell>
  );
}
