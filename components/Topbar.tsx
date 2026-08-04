"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Plus, Download, Search } from "lucide-react";
import { GlobalSearchPalette } from "./GlobalSearchPalette";
import { useDashboard } from "@/contexts/DashboardContext";
import { exportsApi } from "@/lib/api";
import { useApiMutation } from "@/lib/api/hooks";
import { downloadExport } from "@/lib/download";

const pageTitles: Record<string, string> = {
  "/dashboard":                "Research",
  "/dashboard/reports":        "Reports",
  "/dashboard/citation-graph": "Citation Graph",
  "/dashboard/draft-studio":   "Draft Studio",
  "/dashboard/library":        "Library",
  "/dashboard/digest":         "Digest",
  "/dashboard/legislation":    "Legislation",
  "/dashboard/practice":       "Practice & Forms",
  "/dashboard/dictionary":     "Dictionary",
  "/dashboard/secondary-sources": "Journals & Commentary",
  "/dashboard/profile":        "Profile",
};

/** Nested routes such as /dashboard/legislation/cama-2020 keep their section's title. */
function titleForPath(pathname: string): string {
  if (pathname.startsWith("/dashboard/cases/")) return "Judgment report";
  const match = Object.keys(pageTitles)
    .filter((base) => base !== "/dashboard" && pathname.startsWith(base))
    .sort((a, b) => b.length - a.length)[0];
  return match ? pageTitles[match] : (pageTitles[pathname] ?? "Research");
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedCaseId, showToast } = useDashboard();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [modKey, setModKey] = useState("Ctrl");
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setModKey(/Mac|iPhone|iPad/i.test(navigator.userAgent) ? "⌘" : "Ctrl");
  }, []);

  const title = selectedCaseId ? "Judgment report" : titleForPath(pathname);

  // A judgment is exportable whether it was opened as an overlay or by permalink.
  const permalinkCaseId = pathname.startsWith("/dashboard/cases/")
    ? decodeURIComponent(pathname.slice("/dashboard/cases/".length))
    : null;
  const exportableCaseId = selectedCaseId ?? permalinkCaseId;

  const exportCase = useApiMutation((caseId: string) =>
    exportsApi.researchBundle({ caseIds: [caseId], format: "pdf" }),
  );

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => {
    setPaletteOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => {
          if (open) triggerRef.current?.focus({ preventScroll: true });
          return !open;
        });
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  async function handleExport() {
    if (!exportableCaseId) return;
    const file = await exportCase.mutate(exportableCaseId);
    if (file) {
      downloadExport(file);
      showToast(`${file.filename} downloaded.`);
    } else if (exportCase.error) {
      showToast(exportCase.error);
    }
  }

  return (
    <>
      <header className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="hamburger-btn" onClick={onMenuClick} aria-label="Open menu">
            <Menu size={18} />
          </button>
          <div>
            <div className="topbar-date">{dateFormat.format(new Date())}</div>
            <div className="topbar-title">{title}</div>
          </div>
        </div>
        <div className="topbar-actions">
          <button
            ref={triggerRef}
            type="button"
            className="search-palette-trigger"
            onClick={openPalette}
            aria-haspopup="dialog"
            aria-expanded={paletteOpen}
          >
            <Search size={14} />
            <span>Search everywhere</span>
            <kbd>{modKey}K</kbd>
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => router.push("/dashboard/library?tab=matters&new=1")}
          >
            <Plus size={12} /> <span>New matter</span>
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleExport}
            disabled={!exportableCaseId || exportCase.pending}
            title={
              exportableCaseId
                ? "Export this judgment as a research bundle"
                : "Open a judgment to export it"
            }
          >
            <Download size={12} />{" "}
            <span>{exportCase.pending ? "Exporting…" : "Export"}</span>
          </button>
        </div>
      </header>
      <GlobalSearchPalette open={paletteOpen} onClose={closePalette} />
    </>
  );
}
