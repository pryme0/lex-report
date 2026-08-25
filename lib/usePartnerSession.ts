"use client";

import { useEffect, useState } from "react";

export interface PartnerSession {
  partnerName: string;
  access: string[];
}

export function usePartnerSession(): PartnerSession | null {
  const [session, setSession] = useState<PartnerSession | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("lr_partner_session");
    if (stored) {
      try {
        setSession(JSON.parse(stored));
      } catch {
        setSession(null);
      }
    }
  }, []);

  return session;
}

export function isPartnerSession(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("lr_partner_session");
}

export function clearPartnerSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("lr_partner_session");
}

// Check if a route is allowed for partner users
export function isRouteAllowedForPartner(pathname: string, partnerSession: PartnerSession | null): boolean {
  if (!partnerSession) return true; // Not a partner session, allow all

  const { access } = partnerSession;

  // Check access permissions
  if (access.includes("research") && pathname.includes("/research")) return true;
  if (access.includes("chat") && (pathname.includes("/chat") || pathname === "/dashboard")) return true;
  if (access.includes("view") && pathname.includes("/cases/")) return true;

  return false;
}
