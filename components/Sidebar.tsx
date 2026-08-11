"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, FileText, Share2, PenLine, BookOpen, BookText, Gavel, Languages, LogOut, BookMarked, Scale, GraduationCap, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { catalogApi, usersApi } from "@/lib/api";
import { useApiQuery } from "@/lib/api/hooks";
import { clearTokens } from "@/lib/api/axios";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Research",       href: "/dashboard",                icon: Search },
  { label: "Reports",        href: "/dashboard/reports",        icon: FileText },
  { label: "Citation Graph", href: "/dashboard/citation-graph", icon: Share2 },
  { label: "Draft Studio",   href: "/dashboard/draft-studio",   icon: PenLine },
  { label: "Library",        href: "/dashboard/library",        icon: BookOpen },
  { label: "Digest",         href: "/dashboard/digest",          icon: BookText },
  { label: "Legislation",    href: "/dashboard/legislation",     icon: Gavel },
  { label: "Practice & Forms", href: "/dashboard/practice",      icon: Scale },
  { label: "Dictionary",     href: "/dashboard/dictionary",      icon: Languages },
  { label: "Journals & Commentary", href: "/dashboard/secondary-sources", icon: GraduationCap },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  peeking: boolean;
  onPeekChange: (peeking: boolean) => void;
}

export function Sidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapsed,
  peeking,
  onPeekChange,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  // `collapsed` is the at-rest preference (explicit toggle, or auto-collapsed for a
  // detail view); `peeking` is "mouse is over the rail right now". Whether the sidebar is
  // actually wide on screen is the OR of the two — never a state the toggle has to fight
  // to force, which is what caused the old collapse-then-instantly-reopen bug: clicking
  // collapse while still hovering used to try to visually shrink the sidebar out from
  // under the cursor, and the browser's own hit-test recompute on that reflow immediately
  // re-fired hover and undid it. With a plain OR, clicking collapse while hovering simply
  // leaves it open (correct — the pointer is still on it) and it shrinks the moment the
  // mouse actually leaves, exactly like the admin app's sidebar.
  const expanded = !collapsed || peeking;
  const profileQuery = useApiQuery("users:profile", () => usersApi.profile());
  const profile = profileQuery.data;
  const filtersQuery = useApiQuery("catalog:filters", () => catalogApi.filters());
  const years = filtersQuery.data?.years;
  const coverageSpan =
    years?.min && years?.max ? `${years.min} – ${years.max}` : "—";

  async function logout() {
    try {
      await usersApi.logout();
    } catch {
      // Ignore — we're clearing local credentials regardless.
    }
    clearTokens();
    router.push("/login");
  }

  // A pending hover must never override a collapse-state transition. In particular,
  // opening a detail view auto-collapses the sidebar; retaining `peeking=true` from
  // the previously expanded sidebar would keep both it and the shell full width.
  useEffect(() => {
    onPeekChange(false);
  }, [collapsed, onPeekChange]);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside
      className={cn("sidebar", open && "open", !expanded && "rail")}
      onMouseEnter={() => {
        if (collapsed) onPeekChange(true);
      }}
      onMouseLeave={() => onPeekChange(false)}
    >
      <div className="sidebar-top">
        <Link href="/dashboard" className="sidebar-brand" onClick={onClose}>
          <div className="sidebar-mark">Lr</div>
          <span className="sidebar-brand-name">LexReport</span>
        </Link>
        <button
          className="sidebar-pin"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>
        <button className="sidebar-close" onClick={onClose} aria-label="Close menu">
          <X size={16} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn("nav-item", isActive(href) && "active")}
            onClick={onClose}
            title={label}
          >
            <Icon size={16} /> <span className="nav-label">{label}</span>
          </Link>
        ))}

        <div className="nav-divider" />

        <Link
          href="/dashboard/profile"
          className={cn("nav-item", pathname === "/dashboard/profile" && "active")}
          onClick={onClose}
          title="Profile"
        >
          <BookMarked size={16} /> <span className="nav-label">Profile</span>
        </Link>
        <button className="nav-item" onClick={logout} title="Log out">
          <LogOut size={16} /> <span className="nav-label">Log out</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="coverage-chip">
          <div className="coverage-label">Coverage span</div>
          <div className="coverage-range">{coverageSpan}</div>
        </div>
        <Link href="/dashboard/profile" className="user-chip" onClick={onClose} title={profile?.name ?? "Profile"}>
          <div className="user-avatar">{profile?.initials ?? "···"}</div>
          <div className="user-chip-info">
            <span className="user-name">{profile?.name ?? "Loading…"}</span>
            <span className="user-role">{profile?.accountRole ?? "—"}</span>
          </div>
        </Link>
      </div>
    </aside>
  );
}
