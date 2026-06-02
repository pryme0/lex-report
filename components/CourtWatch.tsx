"use client";

import { Plus } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";
import { alerts } from "@/lib/data";

export function CourtWatch() {
  const { showToast } = useDashboard();
  return (
    <div className="page">
      <div className="page-header">
        <div><p className="label">Court watch</p><h2>Recent movement</h2></div>
        <button className="btn btn-secondary btn-sm" onClick={() => showToast("Alert created.")}>
          <Plus size={12} /> Create alert
        </button>
      </div>
      <div className="watch-grid">
        {alerts.map(({ court, topic, change, time }) => (
          <div className="watch-card" key={topic}>
            <div>
              <span className="watch-badge">{court}</span>
              <div className="watch-topic">{topic}</div>
              <div className="watch-desc">{change}</div>
            </div>
            <div className="watch-time">{time} ago</div>
          </div>
        ))}
      </div>
    </div>
  );
}
