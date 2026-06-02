"use client";

import { usePathname, useRouter } from "next/navigation";
import { Menu, Plus, Download } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";

const pageTitles: Record<string, string> = {
  "/dashboard":                "Research",
  "/dashboard/reports":        "Reports",
  "/dashboard/citation-graph": "Citation Graph",
  "/dashboard/court-watch":    "Court Watch",
  "/dashboard/draft-studio":   "Draft Studio",
  "/dashboard/library":        "Library",
  "/dashboard/profile":        "Profile",
};

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedCase, showToast } = useDashboard();

  const title = selectedCase ? "Judgment report" : (pageTitles[pathname] ?? "Research");

  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="hamburger-btn" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={18} />
        </button>
        <div>
          <div className="topbar-date">Tuesday, 2 June 2026</div>
          <div className="topbar-title">{title}</div>
        </div>
      </div>
      <div className="topbar-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => router.push("/dashboard/draft-studio")}>
          <Plus size={12} /> <span>New matter</span>
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => showToast("Research bundle export prepared.")}>
          <Download size={12} /> <span>Export</span>
        </button>
      </div>
    </header>
  );
}
