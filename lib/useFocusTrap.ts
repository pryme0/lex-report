"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Keeps keyboard focus inside an overlay while it is open, and hands focus back to
 * whatever opened it on close. Without this, tabbing out of a dialog lands on the page
 * behind it, which a screen reader user has no way of noticing.
 *
 * Returns a ref to attach to the overlay's outermost element.
 */
export function useFocusTrap<T extends HTMLElement>(
  active: boolean,
  onEscape?: () => void,
) {
  const containerRef = useRef<T | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    restoreRef.current = document.activeElement as HTMLElement | null;

    const focusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

    // Move focus in, preferring the first control over the container itself.
    const initial = focusable()[0] ?? container;
    initial.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onEscape) {
        event.stopPropagation();
        onEscape();
        return;
      }
      if (event.key !== "Tab") return;

      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;

      if (event.shiftKey && (current === first || !container.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      restoreRef.current?.focus?.({ preventScroll: true });
    };
  }, [active, onEscape]);

  return containerRef;
}
