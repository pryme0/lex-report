"use client";

import { AlertTriangle, Loader2 } from "lucide-react";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="async-state" role="status" aria-live="polite">
      <Loader2 size={16} className="async-spinner" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="async-state async-error" role="alert">
      <AlertTriangle size={16} />
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-ghost btn-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="async-state">
      <p>{message}</p>
    </div>
  );
}

/**
 * Renders the right state for a query without each caller repeating the ladder.
 * Children only run once data has arrived.
 *
 * While a follow-up request is in flight (a new page, a changed filter) the previous results stay
 * on screen but are dimmed and marked busy, so the user is never shown stale data as if it were
 * the answer to what they just asked for.
 */
export function AsyncSection<T>({
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
  if (query.loading && query.data === null) return <LoadingState label={loadingLabel} />;
  if (query.error) return <ErrorState message={query.error} onRetry={query.refetch} />;
  if (query.data === null) return null;
  if (emptyMessage && isEmpty?.(query.data)) return <EmptyState message={emptyMessage} />;
  if (query.loading) {
    return (
      <div className="async-refreshing" aria-busy="true">
        {children(query.data)}
      </div>
    );
  }
  return <>{children(query.data)}</>;
}
