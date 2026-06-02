"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { CaseItem } from "@/lib/types";

interface DashboardContextValue {
  selectedCase: CaseItem | null;
  setSelectedCase: (c: CaseItem | null) => void;
  graphCase: CaseItem | null;
  viewGraph: (c: CaseItem) => void;
  toast: string;
  showToast: (m: string) => void;
  clearToast: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [graphCase, setGraphCase] = useState<CaseItem | null>(null);
  const [toast, setToast] = useState("");

  const viewGraph = useCallback((c: CaseItem) => {
    setGraphCase(c);
    setSelectedCase(null);
    router.push("/dashboard/citation-graph");
  }, [router]);

  const showToast = useCallback((m: string) => setToast(m), []);
  const clearToast = useCallback(() => setToast(""), []);

  return (
    <DashboardContext.Provider value={{ selectedCase, setSelectedCase, graphCase, viewGraph, toast, showToast, clearToast }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside DashboardProvider");
  return ctx;
}
