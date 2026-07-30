"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { adminApi } from "@/lib/api";
import type { AdminCase, Paginated } from "@/lib/api";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { useDashboard } from "@/contexts/DashboardContext";
import { AdminAsyncSection } from "./AdminAsyncSection";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function JudgmentList() {
  const { showToast } = useDashboard();
  const [q, setQ] = useState("");
  const [publishedFilter, setPublishedFilter] = useState<"all" | "published" | "draft">("all");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<AdminCase | null>(null);

  const queryKey = `admin:cases:${q}:${publishedFilter}:${page}`;
  const listQuery = useApiQuery(queryKey, () =>
    adminApi.cases({
      q: q.trim() || undefined,
      published:
        publishedFilter === "all" ? undefined : publishedFilter === "published",
      page,
      limit: 20,
    }),
  );

  const deleteMutation = useApiMutation((id: string) => adminApi.deleteCase(id));

  async function confirmDelete() {
    if (!deleteTarget) return;
    const ok = await deleteMutation.mutate(deleteTarget.id);
    if (ok) {
      showToast(`Deleted ${deleteTarget.id}.`);
      setDeleteTarget(null);
      listQuery.refetch();
    }
  }

  return (
    <div>
      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={14} aria-hidden="true" />
          <input
            className="admin-search-input"
            placeholder="Search judgments…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="admin-filter-tabs" role="tablist" aria-label="Publication filter">
          {(
            [
              ["all", "All"],
              ["published", "Published"],
              ["draft", "Unpublished"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={publishedFilter === value}
              className={`admin-filter-tab${publishedFilter === value ? " active" : ""}`}
              onClick={() => {
                setPublishedFilter(value);
                setPage(1);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <Link href="/dashboard/admin/judgments/new" className="btn btn-primary btn-sm">
          <Plus size={12} /> New judgment
        </Link>
      </div>

      <AdminAsyncSection
        query={listQuery}
        loadingLabel="Loading judgments…"
        emptyMessage="No judgments match your filters."
        isEmpty={(d: Paginated<AdminCase>) => d.data.length === 0}
      >
        {(data) => (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Court</th>
                    <th>Year</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((item) => (
                    <tr key={item.id}>
                      <td className="admin-mono">{item.id}</td>
                      <td>
                        <Link href={`/dashboard/admin/judgments/${item.id}`} className="admin-link">
                          {item.title}
                        </Link>
                      </td>
                      <td>{item.court}</td>
                      <td>{item.year}</td>
                      <td>
                        <span
                          className={`admin-pill${item.published ? " admin-pill-published" : " admin-pill-draft"}`}
                        >
                          {item.published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="admin-row-actions">
                        <Link
                          href={`/dashboard/admin/judgments/${item.id}`}
                          className="btn btn-ghost btn-sm"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm admin-btn-danger-text"
                          onClick={() => setDeleteTarget(item)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.meta.totalPages > 1 && (
              <div className="admin-pagination">
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={data.meta.page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {data.meta.page} of {data.meta.totalPages}
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={data.meta.page >= data.meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </AdminAsyncSection>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete judgment"
        body={
          deleteTarget ? (
            <>
              Permanently remove <strong>{deleteTarget.title}</strong> ({deleteTarget.id}) from the
              archive. Published citations will stop resolving to this record.
            </>
          ) : null
        }
        confirmLabel="Delete"
        destructive
        busy={deleteMutation.pending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
