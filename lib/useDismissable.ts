"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

/**
 * Dismisses on Escape or an outside pointer press, then returns focus to the
 * element that opened the overlay.
 */
export function useDismissable<T extends HTMLElement>(
  open: boolean,
  onDismiss: () => void,
  triggerRef?: RefObject<HTMLElement | null>,
) {
  const containerRef = useRef<T | null>(null);

  const dismiss = useCallback(() => {
    onDismiss();
    requestAnimationFrame(() => {
      triggerRef?.current?.focus({ preventScroll: true });
    });
  }, [onDismiss, triggerRef]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (triggerRef?.current?.contains(target)) return;
      dismiss();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        dismiss();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open, dismiss, triggerRef]);

  return containerRef;
}
