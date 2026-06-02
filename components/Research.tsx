"use client";

import { Search, Filter, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { CaseEntry } from "./CaseEntry";
import { useDashboard } from "@/contexts/DashboardContext";
import { cases, alerts } from "@/lib/data";

export function Research() {
  const { showToast, viewGraph } = useDashboard();

  return (
    <div className="page">
      <div className="search-bar">
        <div className="search-input-wrap">
          <Search />
          <input className="search-input" defaultValue="priority of floating charge against purchaser with notice" aria-label="Search query" />
        </div>
        <button className="btn btn-primary" onClick={() => showToast("Search results refreshed.")}>Search corpus</button>
      </div>

      <div className="filters">
        <Filter size={12} style={{ color: "var(--color-faint)", marginTop: 2 }} />
        {["Supreme Court", "Court of Appeal", "2020–2026", "Ratio only", "Positive treatment", "Verified"].map(f => (
          <button className="filter-pill" key={f} onClick={() => showToast(`${f} filter applied.`)}>{f}</button>
        ))}
      </div>

      <div className="content-grid">
        <div>
          <div className="page-header" style={{ marginBottom: 10 }}>
            <div><p className="label">Best matches</p><h2>Verified authorities</h2></div>
            <button className="btn btn-ghost btn-sm" onClick={() => showToast("Sorted by precedential strength.")}>
              <Filter size={12} /> Sort by strength
            </button>
          </div>
          <div className="case-list">
            {cases.map(item => <CaseEntry key={item.id} item={item} />)}
          </div>
        </div>

        <aside className="insight-stack">
          <div className="insight-panel tinted">
            <div className="insight-head">
              <div><p className="label">Research assistant</p><h3>Authority map</h3></div>
            </div>
            <div className="authority-nodes">
              <div className="authority-node root">Zenith Trustees</div>
              <div className="authority-node">U.B.N. v. Tropic Foods</div>
              <div className="authority-node">Afolabi v. Registrar</div>
              <div className="authority-node dim">Okonkwo v. Intercity Bank</div>
            </div>
            <p className="insight-note">Strongest path: perfection of security, notice, and crystallisation timing.</p>
            <Link href="/dashboard/draft-studio" className="btn btn-primary btn-sm">
              Generate argument skeleton <ArrowRight size={12} />
            </Link>
          </div>

          <div className="insight-panel">
            <div className="insight-head">
              <div><p className="label">Court watch</p><h3>Live changes</h3></div>
              <Link href="/dashboard/court-watch" className="btn btn-link btn-sm">View all</Link>
            </div>
            <div className="alert-feed">
              {alerts.map(({ court, topic, change, time }) => (
                <div className="alert-row" key={topic}>
                  <div className="alert-topic">{topic}</div>
                  <div className="alert-change">{change}</div>
                  <div className="alert-meta">{court} · {time} ago</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
