"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { DashboardProvider, useDashboard } from "@/contexts/DashboardContext";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { JudgmentDetail } from "@/components/JudgmentDetail";

function Toast() {
  const { toast, clearToast } = useDashboard();
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 3000);
    return () => clearTimeout(t);
  }, [toast, clearToast]);
  if (!toast) return null;
  return (
    <div className="toast">
      <div className="toast-dot"><Check size={10} strokeWidth={3} /></div>
      {toast}
    </div>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { selectedCase } = useDashboard();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="shell">
      <div
        className={`sidebar-overlay${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="workspace">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        {selectedCase ? <JudgmentDetail /> : children}
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
