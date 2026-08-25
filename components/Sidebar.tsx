"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, FileText, Share2, PenLine, BookOpen, BookText, Gavel, Languages, LogOut, BookMarked, Scale, SlidersHorizontal, PanelLeftClose, PanelLeftOpen, X, MessageSquare } from "lucide-react";
import { catalogApi, usersApi } from "@/lib/api";
import { useApiQuery } from "@/lib/api/hooks";
import { clearTokens } from "@/lib/api/axios";
import { cn } from "@/lib/utils";
import { usePartnerSession, clearPartnerSession } from "@/lib/usePartnerSession";

const navItems = [
  { label: "Chat",           href: "/dashboard",                icon: MessageSquare },
  { label: "Research",       href: "/dashboard/research",       icon: Search },
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
  const expanded = !collapsed || peeking;
  const partnerSession = usePartnerSession();
  const isPartner = !!partnerSession;

  const profileQuery = useApiQuery("users:profile", () => usersApi.profile());
  const profile = profileQuery.data;
  const filtersQuery = useApiQuery("catalog:filters", () => catalogApi.filters());
  const years = filtersQuery.data?.years;
  const coverageSpan =
    years?.min && years?.max ? `${years.min} – ${years.max}` : "—";

  // Filter nav items for partner users - only show Chat and Research
  const partnerAllowedHrefs = ["/dashboard", "/dashboard/research"];
  const visibleNavItems = isPartner
    ? navItems.filter(item => partnerAllowedHrefs.includes(item.href))
    : navItems;

  async function logout() {
    try {
      await usersApi.logout();
    } catch {
      // Local credentials must still be cleared if the server is unavailable.
    }
    clearTokens();
    clearPartnerSession();
    router.push("/login");
  }

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
          <div className="sidebar-mark">ELR</div>
          <span className="sidebar-brand-name">Electronic Lextech Report</span>
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
        {visibleNavItems.map(({ label, href, icon: Icon }) => (
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

        {!isPartner && <div className="nav-divider" />}

        {!isPartner && profile?.editor && (
          <>
            <Link
              href="/dashboard/reports"
              className={cn("nav-item", isActive("/dashboard/reports") && "active")}
              onClick={onClose}
              title="Reports"
            >
              <FileText size={16} /> <span className="nav-label">Reports</span>
            </Link>
            <Link
              href="/dashboard/admin"
              className={cn("nav-item", isActive("/dashboard/admin") && "active")}
              onClick={onClose}
              title="Editorial"
            >
              <SlidersHorizontal size={16} /> <span className="nav-label">Editorial</span>
            </Link>
          </>
        )}

        {!isPartner && (
          <Link
            href="/dashboard/profile"
            className={cn("nav-item", pathname === "/dashboard/profile" && "active")}
            onClick={onClose}
            title="Profile"
          >
            <BookMarked size={16} /> <span className="nav-label">Profile</span>
          </Link>
        )}
        <button className="nav-item" onClick={logout} title="Log out">
          <LogOut size={16} /> <span className="nav-label">Log out</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        {isPartner ? (
          <div className="coverage-chip">
            <div className="coverage-label">Partner access via</div>
            <div className="coverage-range">{partnerSession?.partnerName}</div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </aside>
  );
}
