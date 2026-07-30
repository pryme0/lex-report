"use client";

import { ShieldOff } from "lucide-react";
import { usersApi } from "@/lib/api";
import { useApiQuery } from "@/lib/api/hooks";
import { AsyncSection } from "@/components/AsyncState";

export function EditorGate({ children }: { children: React.ReactNode }) {
  const profileQuery = useApiQuery("users:me:editor-gate", () => usersApi.profile());

  return (
    <AsyncSection query={profileQuery} loadingLabel="Checking editorial access…">
      {(profile) =>
        profile.editor ? (
          children
        ) : (
          <div className="admin-unavailable">
            <ShieldOff size={28} aria-hidden="true" />
            <h2>Editorial area not available</h2>
            <p>
              Your account does not have editorial permissions. Contact your firm administrator
              if you need access to the CMS.
            </p>
          </div>
        )
      }
    </AsyncSection>
  );
}
