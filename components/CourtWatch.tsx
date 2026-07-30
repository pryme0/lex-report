"use client";

import { Plus } from "lucide-react";
import { alerts } from "@/lib/data";

export function CourtWatch() {
  return (
    <div className="page">
      <div className="page-header">
        <div><p className="label">Court watch</p><h2>Recent movement</h2></div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled
          title="Alerts are not available yet — the Court Watch API is not connected in this phase."
        >
          <Plus size={12} /> Create alert
        </button>
      </div>
      <p
        style={{
          margin: "0 0 20px",
          fontSize: "0.825rem",
          color: "var(--color-muted)",
          lineHeight: 1.6,
        }}
      >
        Sample data only — this feed will connect to the Court Watch API in a later release.
      </p>
      <div className="watch-grid">
        {alerts.map(({ court, topic, change, time }) => (
          <div className="watch-card" key={`${court}::${topic}`}>
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
