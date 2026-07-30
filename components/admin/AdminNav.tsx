"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard/admin/judgments", label: "Judgments" },
  { href: "/dashboard/admin/legislation", label: "Legislation" },
  { href: "/dashboard/admin/dictionary", label: "Dictionary" },
  { href: "/dashboard/admin/practice", label: "Practice" },
  { href: "/dashboard/admin/coverage", label: "Coverage" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label="Editorial sections">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn("admin-nav-link", pathname.startsWith(link.href) && "active")}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
