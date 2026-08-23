"use client";

import { Scale } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";
import { casesApi } from "@/lib/api";
import { useApiQuery } from "@/lib/api/hooks";

function SideCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="summary-card">
      <div className="summary-card-label">
        <Scale size={13} aria-hidden="true" />
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}

export function SimilarCases({ caseId }: { caseId: string }) {
  const { openCase } = useDashboard();
  const query = useApiQuery(`similar:${caseId}`, () => casesApi.similar(caseId));

  if (query.loading && query.data === null) return null;
  if (query.error || !query.data || query.data.length === 0) return null;

  return (
    <SideCard label="Similar cases">
      <div className="authority-links">
        {query.data.map((c) => (
          <button
            key={c.id}
            className="authority-link-btn similar-case-btn"
            onClick={() => openCase(c.id)}
            title={c.matchReasons.join(" · ")}
          >
            <span className="similar-case-title">{c.title}</span>
            <span className="similar-case-meta">
              {c.court} · {c.year}
            </span>
          </button>
        ))}
      </div>
    </SideCard>
  );
}
