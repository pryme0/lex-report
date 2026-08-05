"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, FileText, Share2, PenLine, BookOpen, BookText, Gavel, Languages, LogOut, BookMarked, Scale, GraduationCap, Pin, PinOff, X } from "lucide-react";
import { catalogApi, usersApi } from "@/lib/api";
import { useApiQuery } from "@/lib/api/hooks";
import { clearTokens } from "@/lib/api/axios";
import { cn } from "@/lib/utils";

const PIN_STORAGE_KEY = "lr-sidebar-pinned";

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
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const profileQuery = useApiQuery("users:profile", () => usersApi.profile());
  const profile = profileQuery.data;
  const filtersQuery = useApiQuery("catalog:filters", () => catalogApi.filters());
  const years = filtersQuery.data?.years;
  const coverageSpan =
    years?.min && years?.max ? `${years.min} – ${years.max}` : "—";

  // Collapsed to a rail by default; hovering expands it, leaving collapses it again,
  // unless the user has pinned it open (persisted so it survives reloads).
  const [pinned, setPinned] = useState(false);
  const [hovering, setHovering] = useState(false);
  const expanded = pinned || hovering;

  useEffect(() => {
    setPinned(localStorage.getItem(PIN_STORAGE_KEY) === "1");
  }, []);

  function togglePin() {
    setPinned((prev) => {
      const next = !prev;
      localStorage.setItem(PIN_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  async function logout() {
    try {
      await usersApi.logout();
    } catch {
      // Ignore — we're clearing local credentials regardless.
    }
    clearTokens();
    router.push("/login");
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside
      className={cn("sidebar", open && "open", expanded && "expanded")}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="sidebar-top">
        <Link href="/dashboard" className="sidebar-brand" onClick={onClose}>
          <div className="sidebar-mark">Lr</div>
          <span className="sidebar-brand-name">LexReport</span>
        </Link>
        <button
          className="sidebar-pin"
          onClick={togglePin}
          aria-label={pinned ? "Unpin sidebar" : "Pin sidebar open"}
          aria-pressed={pinned}
          title={pinned ? "Unpin sidebar" : "Pin sidebar open"}
        >
          {pinned ? <PinOff size={14} /> : <Pin size={14} />}
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
