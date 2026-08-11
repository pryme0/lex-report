"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { JudgmentDetail } from "@/components/JudgmentDetail";
import { isDetailRoute } from "@/lib/routes";
import { useSidebarCollapse } from "@/lib/useSidebarCollapse";
import { cn } from "@/lib/utils";

function Toast() {
  const { toast, clearToast } = useDashboard();
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 3000);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  // The live region stays mounted even when empty. A region that appears at the same
  // moment as its text is not reliably announced by screen readers.
  return (
    <div className="toast-region" role="status" aria-live="polite" aria-atomic="true">
      {toast ? (
        <div className="toast">
          <div className="toast-dot" aria-hidden="true">
            <Check size={10} strokeWidth={3} />
          </div>
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { selectedCaseId, closeCase } = useDashboard();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const detailKey = selectedCaseId
    ? `case:${selectedCaseId}`
    : isDetailRoute(pathname)
      ? pathname
      : null;
  const { collapsed, toggle } = useSidebarCollapse(detailKey);
  const [peeking, setPeeking] = useState(false);
  const expanded = !collapsed || peeking;

  // The judgment overlay replaces the routed page, so it has to give way when the user
  // navigates — otherwise nav links change the URL while the screen appears frozen.
  useEffect(() => {
    closeCase();
  }, [pathname, closeCase]);

  return (
    <div className={cn("shell", !expanded && "shell-rail")}>
      <div
        className={`sidebar-overlay${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapsed={toggle}
        peeking={peeking}
        onPeekChange={setPeeking}
      />
      <div className="workspace">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        {selectedCaseId ? <JudgmentDetail caseId={selectedCaseId} /> : children}
      </div>
      <Toast />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem("lr-auth");
    if (!auth) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  return (
    <DashboardProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
