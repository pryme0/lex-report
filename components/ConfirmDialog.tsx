"use client";

import { useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { useFocusTrap } from "@/lib/useFocusTrap";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  /** What will happen, in the user's terms. Say what is lost, not "are you sure?". */
  body: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Marks the action as irreversible, which styles the confirm button as a warning. */
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * An in-app replacement for `window.confirm`, which is unstyled, blocks the main
 * thread, and cannot be reached by assistive technology in the way a real dialog can.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const handleEscape = useCallback(() => {
    if (!busy) onCancel();
  }, [busy, onCancel]);

  const dialogRef = useFocusTrap<HTMLDivElement>(open, handleEscape);

  if (!open) return null;

  return (
    <div className="dialog-backdrop" onMouseDown={handleEscape}>
      <div
        ref={dialogRef}
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-body"
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          {destructive && (
            <span className="dialog-icon" aria-hidden="true">
              <AlertTriangle size={14} />
            </span>
          )}
          <h2 id="confirm-dialog-title" className="dialog-title">
            {title}
          </h2>
        </div>

        <div id="confirm-dialog-body" className="dialog-body">
          {body}
        </div>

        <div className="dialog-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${destructive ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
