"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, FileText, Share2, PenLine, BookOpen, BookText, Gavel, Languages, LogOut, BookMarked, Scale, SlidersHorizontal, X } from "lucide-react";
import { catalogApi, usersApi } from "@/lib/api";
import { useApiQuery } from "@/lib/api/hooks";
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
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  peeking?: boolean;
  onPeekChange?: (peeking: boolean) => void;
}

export function Sidebar({ open, onClose, collapsed: _collapsed, onToggleCollapsed: _onToggleCollapsed, peeking: _peeking, onPeekChange: _onPeekChange }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const profileQuery = useApiQuery("users:profile", () => usersApi.profile());
  const profile = profileQuery.data;
  const filtersQuery = useApiQuery("catalog:filters", () => catalogApi.filters());
  const years = filtersQuery.data?.years;
  const coverageSpan =
    years?.min && years?.max ? `${years.min} – ${years.max}` : "—";

  function logout() {
    sessionStorage.removeItem("lr-auth");
    router.push("/");
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside className={cn("sidebar", open && "open")}>
      <div className="sidebar-top">
        <Link href="/dashboard" className="sidebar-brand" onClick={onClose}>
          <div className="sidebar-mark">Lr</div>
          <span className="sidebar-brand-name">LexReport</span>
        </Link>
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
          >
            <Icon size={16} /> {label}
          </Link>
        ))}

        <div className="nav-divider" />

        {profile?.editor && (
          <Link
            href="/dashboard/admin"
            className={cn("nav-item", isActive("/dashboard/admin") && "active")}
            onClick={onClose}
          >
            <SlidersHorizontal size={16} /> Editorial
          </Link>
        )}

        <Link
          href="/dashboard/profile"
          className={cn("nav-item", pathname === "/dashboard/profile" && "active")}
          onClick={onClose}
        >
          <BookMarked size={16} /> Profile
        </Link>
        <button className="nav-item" onClick={logout}>
          <LogOut size={16} /> Log out
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="coverage-chip">
          <div className="coverage-label">Coverage span</div>
          <div className="coverage-range">{coverageSpan}</div>
        </div>
        <Link href="/dashboard/profile" className="user-chip" onClick={onClose}>
          <div className="user-avatar">{profile?.initials ?? "···"}</div>
          <div>
            <span className="user-name">{profile?.name ?? "Loading…"}</span>
            <span className="user-role">{profile?.accountRole ?? "—"}</span>
          </div>
        </Link>
      </div>
    </aside>
  );
}
