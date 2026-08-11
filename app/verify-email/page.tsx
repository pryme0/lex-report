"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle, Loader2, XCircle } from "lucide-react";
import { AuthFormHeading, AuthShell } from "@/components/AuthShell";
import { useVerifyEmail } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/axios";

function VerifyEmailContent() {
  const token = useSearchParams().get("token");
  const verifyEmail = useVerifyEmail();

  useEffect(() => {
    if (token && !verifyEmail.isSuccess && !verifyEmail.isError && !verifyEmail.isPending) verifyEmail.mutate(token);
  }, [token, verifyEmail]);

  const isLoading = Boolean(token) && !verifyEmail.isSuccess && !verifyEmail.isError;
  const isSuccess = verifyEmail.isSuccess;
  const isError = !token || verifyEmail.isError;

  return (
    <AuthShell eyebrow="Verified access" title={<>A trusted archive<br />starts with trusted access.</>} deck="Email verification protects saved authorities, matter notes and the research trail behind your work." statLabel="Account status" statValue={isSuccess ? "Email verified" : isError ? "Action required" : "Verification in progress"} statNote={isSuccess ? "Your workspace is ready" : "Protected account access"}>
      <div className={`login-form login-signin-form login-status-card${isError ? " login-status-error" : ""}`}>
        {isLoading && <><Loader2 size={42} className="animate-spin" /><AuthFormHeading eyebrow="Secure verification" title="Verifying your email." description="Please wait while we confirm your protected workspace access." /></>}
        {isSuccess && <><CheckCircle size={42} /><AuthFormHeading eyebrow="Verification complete" title="Email verified." description={verifyEmail.data?.message || "Your email has been verified successfully."} /><Link href="/login" className="btn btn-primary login-submit">Enter research desk <ArrowRight size={15} /></Link></>}
        {isError && <><XCircle size={42} /><AuthFormHeading eyebrow="Verification failed" title="We could not verify this link." description={!token ? "No verification token was provided." : getErrorMessage(verifyEmail.error)} /><Link href="/login" className="btn btn-secondary login-submit">Return to login</Link></>}
      </div>
    </AuthShell>
  );
}

function VerifyFallback() {
  return (
    <AuthShell eyebrow="Verified access" title={<>A trusted archive<br />starts with trusted access.</>} deck="We are preparing the protected email verification flow." statLabel="Account status" statValue="Preparing verification" statNote="This takes only a moment">
      <div className="login-form login-signin-form login-status-card"><Loader2 size={42} className="animate-spin" /><AuthFormHeading eyebrow="Please wait" title="Preparing verification." description="We are loading your secure verification request." /></div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<VerifyFallback />}><VerifyEmailContent /></Suspense>;
}
