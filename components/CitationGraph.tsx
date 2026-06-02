"use client";

import React, { useState } from "react";
import { ChevronDown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Treatment = "Followed" | "Distinguished" | "Questioned" | "Overruled";

type CaseNode = {
  id: string;
  shortTitle: string;
  title: string;
  citation: string;
  court: string;
  year: number;
  treatment: Treatment;
  direction: "center" | "citing" | "cited";
  context: string;
};

type TimelineEvent = {
  id: string;
  date: string;
  year: number;
  caseTitle: string;
  citation: string;
  court: string;
  treatment: Treatment;
  note: string;
};

type GraphTab = "network" | "chain" | "timeline";

// ─── Mock data ────────────────────────────────────────────────────────────────

const CENTER: CaseNode = {
  id: "SC-2034",
  shortTitle: "Zenith Trustees",
  title: "Zenith Trustees Ltd v. Adebayo & Sons Holdings",
  citation: "(2026) 4 LRR 221 (SC)",
  court: "Supreme Court", year: 2026,
  treatment: "Followed",
  direction: "center",
  context: "Lead authority on floating charge crystallisation and priority between competing security holders.",
};

const CITING: CaseNode[] = [
  {
    id: "c1", shortTitle: "Adeyemi v. First Trust",
    title: "Adeyemi v. First Trust Bank Plc",
    citation: "(2026) 7 LRR 44 (FHC)",
    court: "Federal High Court", year: 2026, treatment: "Followed", direction: "citing",
    context: "Court applied the Zenith Trustees crystallisation test directly to a competing debenture holder scenario.",
  },
  {
    id: "c2", shortTitle: "Bankole Investment v. FCMB",
    title: "Bankole Investment Ltd v. First City Monument Bank",
    citation: "(2026) 9 LRR 187 (SC)",
    court: "Supreme Court", year: 2026, treatment: "Followed", direction: "citing",
    context: "Affirmed that notice of a floating charge without perfection cannot defeat a registered purchaser.",
  },
  {
    id: "c3", shortTitle: "Petroleum Trust v. Okafor",
    title: "Petroleum Trust Fund v. Okafor & Sons Holdings",
    citation: "(2025) 18 LRR 309 (CA)",
    court: "Court of Appeal", year: 2025, treatment: "Distinguished", direction: "citing",
    context: "Distinguished on the basis that crystallisation had occurred before the third-party rights attached, reversing the priority analysis.",
  },
];

const CITED: CaseNode[] = [
  {
    id: "a1", shortTitle: "U.B.N. v. Tropic Foods",
    title: "U.B.N. Plc v. Tropic Foods Ltd",
    citation: "(2019) 11 LRR 102 (SC)",
    court: "Supreme Court", year: 2019, treatment: "Followed", direction: "cited",
    context: "Foundation authority on the perfection requirement for floating charges under CAMA.",
  },
  {
    id: "a2", shortTitle: "Intercity Bank v. Fashola",
    title: "Intercity Bank Plc v. Fashola",
    citation: "(2021) 3 LRR 58 (CA)",
    court: "Court of Appeal", year: 2021, treatment: "Followed", direction: "cited",
    context: "Established that a crystallised floating charge takes priority from the moment of crystallisation, not registration.",
  },
  {
    id: "a3", shortTitle: "Afolabi v. Registrar",
    title: "Afolabi v. Registrar of Companies",
    citation: "(2018) 6 LRR 214 (FHC)",
    court: "Federal High Court", year: 2018, treatment: "Distinguished", direction: "cited",
    context: "Distinguished: the charge in Zenith was already perfected — the Afolabi gap-in-registration point did not apply.",
  },
];

const TIMELINE: TimelineEvent[] = [
  {
    id: "t0", date: "14 Mar 2026", year: 2026,
    caseTitle: "Zenith Trustees Ltd v. Adebayo & Sons Holdings",
    citation: "(2026) 4 LRR 221 (SC)",
    court: "Supreme Court",
    treatment: "Followed",
    note: "Judgment delivered. Establishes crystallisation-priority rule for floating charges.",
  },
  {
    id: "t1", date: "28 Apr 2026", year: 2026,
    caseTitle: "Adeyemi v. First Trust Bank Plc",
    citation: "(2026) 7 LRR 44 (FHC)",
    court: "Federal High Court",
    treatment: "Followed",
    note: "Directly applied the Zenith Trustees crystallisation test. First citation.",
  },
  {
    id: "t2", date: "12 May 2025", year: 2025,
    caseTitle: "Petroleum Trust Fund v. Okafor & Sons",
    citation: "(2025) 18 LRR 309 (CA)",
    court: "Court of Appeal",
    treatment: "Distinguished",
    note: "Distinguished on crystallisation timing — third-party rights had not yet attached at the operative date.",
  },
  {
    id: "t3", date: "3 Jun 2026", year: 2026,
    caseTitle: "Bankole Investment Ltd v. First City Monument Bank",
    citation: "(2026) 9 LRR 187 (SC)",
    court: "Supreme Court",
    treatment: "Followed",
    note: "Supreme Court affirmed the perfection-vs-notice distinction. Zenith Trustees cited as controlling authority.",
  },
];

const tcls: Record<Treatment, string> = {
  Followed: "followed", Distinguished: "distinguished",
  Questioned: "questioned", Overruled: "overruled",
};

const TREATMENT_COLORS: Record<Treatment, string> = {
  Followed: "#2d7c54",
  Distinguished: "#1c5c9e",
  Questioned: "#8a5e0e",
  Overruled: "#9a3244",
};

// ─── Case selector ────────────────────────────────────────────────────────────

function CaseSelector({ selected }: { selected: CaseNode }) {
  return (
    <div className="cg-selector">
      <div className="cg-selector-label">Viewing authority map for</div>
      <button className="cg-selector-btn">
        <div className="cg-selector-case">
          <span className="cg-selector-title">{selected.title}</span>
          <span className="cg-selector-cite">{selected.citation}</span>
        </div>
        <ChevronDown size={14} style={{ flexShrink: 0, color: "var(--color-faint)" }} />
      </button>
    </div>
  );
}

// ─── Network Map ──────────────────────────────────────────────────────────────

const SVG_W = 820;
const SVG_H = 480;
const CX = SVG_W / 2;
const CY = SVG_H / 2;
const ORBIT_R = 185;

function nodePosition(idx: number, total: number, direction: "up" | "down") {
  const spread = total === 1 ? 0 : Math.PI * 0.72;
  const base = direction === "up" ? -Math.PI / 2 : Math.PI / 2;
  const angle = total === 1 ? base : base - spread / 2 + (spread / (total - 1)) * idx;
  return { x: CX + ORBIT_R * Math.cos(angle), y: CY + ORBIT_R * Math.sin(angle) };
}

// Wrap text into lines of at most maxChars, up to 3 lines
function splitLabel(text: string, maxChars = 11): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
      if (lines.length === 2) { lines.push(current); break; }
    } else {
      current = candidate;
    }
  }
  if (current && lines.length < 3) lines.push(current);
  return lines;
}

// Shorten an edge so arrowheads don't overlap node circles
function shortenLine(x1: number, y1: number, x2: number, y2: number, trimStart: number, trimEnd: number) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len, uy = dy / len;
  return {
    x1: x1 + ux * trimStart, y1: y1 + uy * trimStart,
    x2: x2 - ux * trimEnd,   y2: y2 - uy * trimEnd,
  };
}

function NetworkMap({ onAction }: { onAction: (m: string) => void }) {
  const [selected, setSelected] = useState<CaseNode | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const citingPositioned = CITING.map((c, i) => ({ ...c, ...nodePosition(i, CITING.length, "up") }));
  const citedPositioned = CITED.map((c, i) => ({ ...c, ...nodePosition(i, CITED.length, "down") }));
  const allPositioned = [...citingPositioned, ...citedPositioned];

  function selectNode(node: CaseNode) {
    setSelected(prev => prev?.id === node.id ? null : node);
    onAction(`Focused on ${node.shortTitle}.`);
  }

  return (
    <div className="cg-network-wrap">
      <div className="cg-svg-area">
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="cg-svg" aria-label="Citation network">
          <defs>
            {/* Arrowhead markers — one per treatment colour */}
            {(Object.entries(TREATMENT_COLORS) as [Treatment, string][]).map(([t, c]) => (
              <marker key={t}
                id={`arrow-${t}`}
                markerWidth="7" markerHeight="7"
                refX="6" refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 7 3.5, 0 7" fill={c} fillOpacity="0.85" />
              </marker>
            ))}
          </defs>

          {/* Edges: citing node → center (arrow at center end) */}
          {citingPositioned.map(n => {
            const e = shortenLine(n.x, n.y, CX, CY, 36, 57);
            const fade = hovered === null || hovered === n.id;
            return (
              <line key={`edge-${n.id}`}
                x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                stroke={TREATMENT_COLORS[n.treatment]}
                strokeWidth={hovered === n.id ? 2.5 : 1.5}
                strokeOpacity={fade ? 0.75 : 0.18}
                markerEnd={`url(#arrow-${n.treatment})`}
                className="cg-edge"
              />
            );
          })}

          {/* Edges: center → cited node (arrow at cited-node end) */}
          {citedPositioned.map(n => {
            const e = shortenLine(CX, CY, n.x, n.y, 57, 36);
            const fade = hovered === null || hovered === n.id;
            return (
              <line key={`edge-${n.id}`}
                x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                stroke={TREATMENT_COLORS[n.treatment]}
                strokeWidth={hovered === n.id ? 2.5 : 1.5}
                strokeOpacity={fade ? 0.75 : 0.18}
                markerEnd={`url(#arrow-${n.treatment})`}
                className="cg-edge"
              />
            );
          })}

          {/* Outer nodes */}
          {allPositioned.map(n => {
            const isHovered = hovered === n.id;
            const isSelected = selected?.id === n.id;
            const r = isHovered || isSelected ? 40 : 36;
            const isCiting = n.direction === "citing";
            const fillColor = isSelected ? TREATMENT_COLORS[n.treatment] : "var(--color-paper)";
            const lines = splitLabel(n.shortTitle);
            const lineH = 11;
            const startY = n.y - ((lines.length - 1) * lineH) / 2;
            const textFill = isSelected ? "#fff" : "var(--color-body)";
            return (
              <g key={n.id} className="cg-node-group"
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => selectNode(n)}
              >
                <circle cx={n.x} cy={n.y} r={r + 7} fill={TREATMENT_COLORS[n.treatment]} fillOpacity="0.07" />
                <circle cx={n.x} cy={n.y} r={r}
                  fill={fillColor}
                  stroke={TREATMENT_COLORS[n.treatment]}
                  strokeWidth={isSelected ? 0 : 2}
                  strokeDasharray={isCiting && !isSelected ? "5 3" : undefined}
                />
                <text
                  x={n.x} y={startY}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="8.5" fontWeight="700" fontFamily="var(--font-sans)"
                  fill={textFill} pointerEvents="none"
                >
                  {lines.map((line, i) => (
                    <tspan key={i} x={n.x} dy={i === 0 ? 0 : lineH}>{line}</tspan>
                  ))}
                </text>
              </g>
            );
          })}

          {/* Center node */}
          <circle cx={CX} cy={CY} r={54} fill="var(--color-g-800)" />
          {(() => {
            const lines = splitLabel(CENTER.shortTitle, 13);
            const lineH = 13;
            const startY = CY - ((lines.length - 1) * lineH) / 2;
            return (
              <text
                x={CX} y={startY}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="10.5" fontWeight="700" fontFamily="var(--font-sans)"
                fill="rgba(255,255,255,0.92)" pointerEvents="none"
              >
                {lines.map((line, i) => (
                  <tspan key={i} x={CX} dy={i === 0 ? 0 : lineH}>{line}</tspan>
                ))}
              </text>
            );
          })()}

          {/* Section labels last — paint on top of all nodes */}
          <text x={CX} y={16} textAnchor="middle" className="cg-label-text">CITING THIS JUDGMENT</text>
          <text x={CX} y={SVG_H - 6} textAnchor="middle" className="cg-label-text">CITED IN THIS JUDGMENT</text>
        </svg>

        {/* Legend */}
        <div className="cg-legend">
          <div className="cg-legend-item">
            <svg width="26" height="10">
              <line x1="0" y1="5" x2="20" y2="5" stroke="var(--color-muted)" strokeWidth="1.5" strokeDasharray="5 3"/>
            </svg>
            <span>Citing</span>
          </div>
          <div className="cg-legend-item">
            <svg width="26" height="10">
              <line x1="0" y1="5" x2="20" y2="5" stroke="var(--color-muted)" strokeWidth="1.5"/>
            </svg>
            <span>Cited</span>
          </div>
          {(Object.entries(TREATMENT_COLORS) as [Treatment, string][]).map(([t, c]) => (
            <div className="cg-legend-item" key={t}>
              <span className="cg-legend-dot" style={{ background: c }} />
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <div className="cg-detail-panel">
        {selected ? (
          <>
            <div className="cg-detail-direction">
              {selected.direction === "citing" ? "▲ Cites this judgment" : "▼ Cited by this judgment"}
            </div>
            <div className={cn("treatment-pill", tcls[selected.treatment])} style={{ marginBottom: 10 }}>
              {selected.treatment}
            </div>
            <div className="cg-detail-title">{selected.title}</div>
            <div className="cg-detail-cite">{selected.citation}</div>
            <div className="cg-detail-meta">{selected.court} · {selected.year}</div>
            <div className="cg-detail-divider" />
            <div className="cg-detail-context-label">Citation context</div>
            <div className="cg-detail-context">{selected.context}</div>
          </>
        ) : (
          <div className="cg-detail-empty">
            <div className="cg-detail-empty-icon">◎</div>
            <div>Click any node to see citation details</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Authority Chain ──────────────────────────────────────────────────────────

function ChainRow({ node }: { node: CaseNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("chain-row", open && "open")}>
      <button className="chain-row-main" onClick={() => setOpen(v => !v)}>
        <div className="chain-row-head">
          <span className={cn("treatment-pill", tcls[node.treatment])}>{node.treatment}</span>
          <span className="chain-row-meta">{node.court} · {node.year}</span>
        </div>
        <div className="chain-row-title">{node.title}</div>
        <div className="chain-row-cite">{node.citation}</div>
      </button>
      {open && (
        <div className="chain-row-context">
          <div className="chain-context-label">Citation context</div>
          <p>{node.context}</p>
        </div>
      )}
    </div>
  );
}

function AuthorityChain() {
  const followedCiting   = CITING.filter(n => n.treatment === "Followed").length;
  const followedCited    = CITED.filter(n => n.treatment === "Followed").length;

  return (
    <div className="cg-chain-wrap">
      {/* Summary bar */}
      <div className="chain-summary-bar">
        <div className="chain-summary-item">
          <div className="chain-summary-num">{CITING.length}</div>
          <div className="chain-summary-desc">cases citing this judgment</div>
        </div>
        <div className="chain-summary-divider" />
        <div className="chain-summary-item">
          <div className="chain-summary-num">{followedCiting}</div>
          <div className="chain-summary-desc">citing with Followed treatment</div>
        </div>
        <div className="chain-summary-divider" />
        <div className="chain-summary-item">
          <div className="chain-summary-num">{CITED.length}</div>
          <div className="chain-summary-desc">authorities drawn on</div>
        </div>
        <div className="chain-summary-divider" />
        <div className="chain-summary-item">
          <div className="chain-summary-num">{followedCited}</div>
          <div className="chain-summary-desc">cited authorities followed</div>
        </div>
      </div>

      {/* Two columns */}
      <div className="chain-cols">
        <div className="chain-col">
          <div className="chain-col-header">
            <div className="chain-col-title">Citing this judgment</div>
            <div className="chain-col-subtitle">Cases that rely on this authority</div>
          </div>
          <div className="chain-list">
            {CITING.map(n => <ChainRow key={n.id} node={n} />)}
          </div>
        </div>

        <div className="chain-col">
          <div className="chain-col-header">
            <div className="chain-col-title">Cited by this judgment</div>
            <div className="chain-col-subtitle">Authorities this judgment draws on</div>
          </div>
          <div className="chain-list">
            {CITED.map(n => <ChainRow key={n.id} node={n} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function Timeline() {
  const totals = TIMELINE.reduce((acc, e) => {
    acc[e.treatment] = (acc[e.treatment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const trendIcon = () => {
    const pos = (totals["Followed"] || 0);
    const neg = (totals["Overruled"] || 0) + (totals["Questioned"] || 0);
    if (pos > neg) return <TrendingUp size={16} style={{ color: "var(--color-g-400)" }} />;
    if (neg > pos) return <TrendingDown size={16} style={{ color: "var(--color-rose)" }} />;
    return <Minus size={16} style={{ color: "var(--color-faint)" }} />;
  };

  return (
    <div className="cg-timeline-wrap">
      {/* Stats bar */}
      <div className="tl-stats-bar">
        <div className="tl-stat">
          <div className="tl-stat-num">{TIMELINE.length}</div>
          <div className="tl-stat-label">Total citations</div>
        </div>
        {(["Followed", "Distinguished", "Questioned", "Overruled"] as Treatment[]).map(t => (
          <div className="tl-stat" key={t}>
            <div className={cn("tl-stat-num", `tl-${t.toLowerCase()}`)}>{totals[t] || 0}</div>
            <div className="tl-stat-label">{t}</div>
          </div>
        ))}
        <div className="tl-stat tl-stat-trend">
          <div className="tl-stat-trend-icon">{trendIcon()}</div>
          <div className="tl-stat-label">
            {(totals["Followed"] || 0) >= TIMELINE.length / 2 ? "Strong authority" : "Authority contested"}
          </div>
        </div>
      </div>

      {/* Timeline events */}
      <div className="tl-events">
        {TIMELINE.map((e, idx) => {
          const isFirst = idx === 0;
          return (
            <div key={e.id} className={cn("tl-event", isFirst && "is-origin")}>
              <div className="tl-event-left">
                <div className="tl-event-date">{e.date}</div>
                <div className="tl-event-court">{e.court}</div>
              </div>
              <div className="tl-event-spine">
                <div className={cn("tl-event-dot", tcls[e.treatment], isFirst && "origin")} />
                {idx < TIMELINE.length - 1 && <div className="tl-event-line" />}
              </div>
              <div className="tl-event-body">
                <div className="tl-event-top">
                  <span className={cn("treatment-pill", tcls[e.treatment])}>{e.treatment}</span>
                  {isFirst && <span className="tl-origin-badge">Origin judgment</span>}
                </div>
                <div className="tl-event-case">{e.caseTitle}</div>
                <div className="tl-event-cite">{e.citation}</div>
                <div className="tl-event-note">{e.note}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Citation Graph (main export) ────────────────────────────────────────────

type ExternalCase = { id: string; title: string; citation: string; court: string; year: number } | null;

export function CitationGraph({ onAction, centerCase }: { onAction: (m: string) => void; centerCase?: ExternalCase }) {
  const [tab, setTab] = useState<GraphTab>("network");

  const tabs: { id: GraphTab; label: string }[] = [
    { id: "network",  label: "Network map" },
    { id: "chain",    label: "Authority chain" },
    { id: "timeline", label: "Timeline" },
  ];

  return (
    <div className="cg-shell">
      {/* Tab bar + case selector */}
      <div className="cg-header">
        <div className="cg-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className={cn("studio-tab", tab === t.id && "active")}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <CaseSelector selected={centerCase ? {
          ...CENTER,
          id: centerCase.id,
          title: centerCase.title,
          citation: centerCase.citation,
          court: centerCase.court,
          year: centerCase.year,
        } : CENTER} />
      </div>

      <div className="cg-body">
        {tab === "network"  && <NetworkMap onAction={onAction} />}
        {tab === "chain"    && <AuthorityChain />}
        {tab === "timeline" && <Timeline />}
      </div>
    </div>
  );
}
