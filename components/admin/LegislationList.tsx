"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { legislationApi } from "@/lib/api";
import type { StatuteListItem } from "@/lib/api";
import { useApiQuery } from "@/lib/api/hooks";
import { AdminAsyncSection } from "./AdminAsyncSection";

export function LegislationList() {
  const listQuery = useApiQuery("admin:legislation", () => legislationApi.list());

  return (
    <div>
      <div className="admin-toolbar">
        <p className="admin-toolbar-note">Acts and regulations in the legislation library.</p>
        <Link href="/dashboard/admin/legislation/new" className="btn btn-primary btn-sm">
          <Plus size={12} /> New statute
        </Link>
      </div>

      <AdminAsyncSection
        query={listQuery}
        loadingLabel="Loading legislation…"
        emptyMessage="No statutes in the library yet."
        isEmpty={(items: StatuteListItem[]) => items.length === 0}
      >
        {(items) => (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Year</th>
                  <th>Jurisdiction</th>
                  <th>Sections</th>
                  <th>In force</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="admin-mono">{item.id}</td>
                    <td>
                      <Link href={`/dashboard/admin/legislation/${item.id}`} className="admin-link">
                        {item.shortTitle}
                      </Link>
                    </td>
                    <td>{item.year}</td>
                    <td>{item.jurisdiction}</td>
                    <td>{item.sectionCount}</td>
                    <td>
                      <span
                        className={`admin-pill${item.inForce ? " admin-pill-published" : " admin-pill-draft"}`}
                      >
                        {item.inForce ? "In force" : "Repealed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminAsyncSection>
    </div>
  );
}
