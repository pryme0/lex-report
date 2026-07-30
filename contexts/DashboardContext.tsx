"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";

interface DashboardContextValue {
  /** Archive id of the judgment shown in the detail overlay, or null for the page content. */
  selectedCaseId: string | null;
  openCase: (id: string) => void;
  closeCase: () => void;
  /** Archive id the citation graph page is centred on. */
  graphCaseId: string | null;
  viewGraph: (id: string) => void;
  toast: string;
  showToast: (m: string) => void;
  clearToast: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [graphCaseId, setGraphCaseId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const openCase = useCallback((id: string) => setSelectedCaseId(id), []);
  const closeCase = useCallback(() => setSelectedCaseId(null), []);

  const viewGraph = useCallback(
    (id: string) => {
      setGraphCaseId(id);
      setSelectedCaseId(null);
      router.push("/dashboard/citation-graph");
    },
    [router],
  );

  const showToast = useCallback((m: string) => setToast(m), []);
  const clearToast = useCallback(() => setToast(""), []);

  return (
    <DashboardContext.Provider
      value={{
        selectedCaseId,
        openCase,
        closeCase,
        graphCaseId,
        viewGraph,
        toast,
        showToast,
        clearToast,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside DashboardProvider");
  return ctx;
}
