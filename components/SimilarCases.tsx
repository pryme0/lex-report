"use client";

import { Scale } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";
import { casesApi } from "@/lib/api";
import { useApiQuery } from "@/lib/api/hooks";

function SideCard({
  label,
  children,
  isExpanded,
  onToggle,
}: {
  label: string;
  children: React.ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div
      className={`summary-card${isExpanded ? " expanded" : ""}`}
      onClick={onToggle}
      role={onToggle ? "button" : undefined}
      tabIndex={onToggle ? 0 : undefined}
      onKeyDown={onToggle ? (e) => { if (e.key === "Enter" || e.key === " ") onToggle(); } : undefined}
    >
      <div className="summary-card-label">
        <Scale size={13} aria-hidden="true" />
        <span>{label}</span>
      </div>
      <div className="summary-card-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function SimilarCases({
  caseId,
  isExpanded,
  onToggle,
}: {
  caseId: string;
  isExpanded?: boolean;
  onToggle?: () => void;
}) {
  const { openCase } = useDashboard();
  const query = useApiQuery(`similar:${caseId}`, () => casesApi.similar(caseId));

  if (query.loading && query.data === null) return null;
  if (query.error || !query.data || query.data.length === 0) return null;

  return (
    <SideCard label="Similar cases" isExpanded={isExpanded} onToggle={onToggle}>
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
