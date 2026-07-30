"use client";

import { ShieldOff } from "lucide-react";
import { AsyncSection } from "@/components/AsyncState";

export function isEditorAccessError(message: string | null): boolean {
  if (!message) return false;
  return message.toLowerCase().includes("editor access required");
}

export function AdminAccessDenied() {
  return (
    <div className="admin-unavailable">
      <ShieldOff size={28} aria-hidden="true" />
      <h2>Editorial area not available</h2>
      <p>
        Your account does not have editorial permissions. Contact your firm administrator if you
        need access to the CMS.
      </p>
    </div>
  );
}

export function AdminAsyncSection<T>({
  query,
  loadingLabel,
  emptyMessage,
  isEmpty,
  children,
}: {
  query: { data: T | null; error: string | null; loading: boolean; refetch: () => void };
  loadingLabel?: string;
  emptyMessage?: string;
  isEmpty?: (data: T) => boolean;
  children: (data: T) => React.ReactNode;
}) {
  if (isEditorAccessError(query.error)) return <AdminAccessDenied />;
  return (
    <AsyncSection
      query={query}
      loadingLabel={loadingLabel}
      emptyMessage={emptyMessage}
      isEmpty={isEmpty}
    >
      {children}
    </AsyncSection>
  );
}
