"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { api, setTokens } from "@/lib/api/axios";
import { Loader2 } from "lucide-react";

interface ViewTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  access: string[];
  partnerName: string;
}

export default function ViewTokenPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Validating access...");

  const caseId = params.id as string;
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Missing access token. Please use the link provided by the partner application.");
      return;
    }

    async function exchangeToken() {
      try {
        setStatus("Authenticating...");

        const { data } = await api.get<ViewTokenResponse>(
          `/auth/view-token?token=${encodeURIComponent(token!)}`
        );

        // Store the session token (no refresh token for partner sessions)
        setTokens(data.accessToken, "");

        // Store partner info for UI - merge with existing session to allow access to multiple cases
        if (typeof window !== "undefined") {
          let existingCaseIds: string[] = [];
          try {
            const existing = localStorage.getItem("lr_partner_session");
            if (existing) {
              const parsed = JSON.parse(existing);
              existingCaseIds = Array.isArray(parsed.caseIds) ? parsed.caseIds : (parsed.caseId ? [parsed.caseId] : []);
            }
          } catch {
            // Ignore parse errors
          }

          // Add new caseId if not already in list
          const caseIds = existingCaseIds.includes(caseId)
            ? existingCaseIds
            : [...existingCaseIds, caseId];

          localStorage.setItem("lr_partner_session", JSON.stringify({
            partnerName: data.partnerName,
            access: data.access,
            caseIds,
            caseId, // Keep for backwards compatibility
          }));
        }

        setStatus("Redirecting to case...");

        // Redirect to the case view
        router.replace(`/dashboard/cases/${encodeURIComponent(caseId)}`);
      } catch (err: unknown) {
        console.error("Token exchange failed:", err);

        const errorMessage = err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            || "Failed to validate access token";

        if (errorMessage.includes("expired")) {
          setError("This link has expired. Please request a new link from the partner application.");
        } else if (errorMessage.includes("revoked")) {
          setError("Partner access has been revoked. Please contact support.");
        } else {
          setError(errorMessage);
        }
      }
    }

    exchangeToken();
  }, [token, caseId, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/login"
            className="inline-block px-4 py-2 bg-[#01331F] text-white rounded-md hover:bg-[#024D2E] transition-colors"
          >
            Sign in with your account
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#01331F] mx-auto mb-4" />
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}
