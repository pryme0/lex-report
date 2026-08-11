"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "lr-sidebar-collapsed";

export type SidebarCollapse = {
  collapsed: boolean;
  toggle: () => void;
};

export function useSidebarCollapse(detailKey: string | null): SidebarCollapse {
  const [userCollapsed, setUserCollapsed] = useState(false);
  const [detailOverride, setDetailOverride] = useState(false);

  useEffect(() => {
    try {
      setUserCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      void 0;
    }
  }, []);

  useEffect(() => {
    setDetailOverride(false);
  }, [detailKey]);

  const collapsed = userCollapsed || (detailKey !== null && !detailOverride);

  const toggle = useCallback(() => {
    const next = !collapsed;
    setUserCollapsed(next);
    setDetailOverride(!next && detailKey !== null);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      void 0;
    }
  }, [collapsed, detailKey]);

  return { collapsed, toggle };
}
