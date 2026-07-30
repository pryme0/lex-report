"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { CaseEntry } from "./CaseEntry";
import { useDashboard } from "@/contexts/DashboardContext";
import { fetchCases } from "@/lib/api";
import type { CaseItem } from "@/lib/types";

export function Reports() {
  const { showToast } = useDashboard();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCases()
      .then(setCases)
      .catch(() => showToast("Could not load published judgments."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div><p className="label">Law reports</p><h2>Published judgments</h2></div>
        <button className="btn btn-secondary btn-sm" onClick={() => showToast("Editorial batch created.")}>
          <Plus size={12} /> New batch
        </button>
      </div>
      <div className="case-list">
        {loading ? (
          <p className="citator-empty">Loading judgments…</p>
        ) : (
          cases.map(item => <CaseEntry key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}
