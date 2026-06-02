"use client";

import { Plus } from "lucide-react";
import { CaseEntry } from "./CaseEntry";
import { useDashboard } from "@/contexts/DashboardContext";
import { cases } from "@/lib/data";

export function Reports() {
  const { showToast } = useDashboard();
  return (
    <div className="page">
      <div className="page-header">
        <div><p className="label">Law reports</p><h2>Published judgments</h2></div>
        <button className="btn btn-secondary btn-sm" onClick={() => showToast("Editorial batch created.")}>
          <Plus size={12} /> New batch
        </button>
      </div>
      <div className="case-list">
        {cases.map(item => <CaseEntry key={item.id} item={item} />)}
      </div>
    </div>
  );
}
