"use client";

import React, { useCallback, useRef, useState } from "react";
import { ChevronDown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { casesApi } from "@/lib/api";
import type { CaseIndexItem, CaseNode, CitationGraph as CitationGraphData, TimelineEvent } from "@/lib/api";
import { useApiQuery } from "@/lib/api/hooks";
import { useDismissable } from "@/lib/useDismissable";
import { tcls, type Treatment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AsyncSection } from "./AsyncState";

type GraphTab = "network" | "chain" | "timeline";

const TREATMENT_COLORS: Record<Treatment, string> = {
  Followed: "#2d7c54",
  Applied: "#2d7c54",
  Approved: "#2d7c54",
  Considered: "#8b8578",
  Explained: "#8b8578",
  "Referred to": "#8b8578",
  Distinguished: "#1c5c9e",
  Doubted: "#8a5e0e",
  Questioned: "#8a5e0e",
  "Not followed": "#8a5e0e",
  "Overruled in part": "#8a5e0e",
  Overruled: "#9a3244",
  "Departed from": "#9a3244",
  "Per incuriam": "#9a3244",
};

// ─── Case selector ────────────────────────────────────────────────────────────

function CaseSelector({
  cases,
  selectedId,
  center,
  onSelect,
}: {
  cases: CaseIndexItem[];
  selectedId: string;
  center: CaseNode;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useDismissable<HTMLDivElement>(open, () => setOpen(false), triggerRef);
  const selected = cases.find((c) => c.id === selectedId) ?? {
    id: center.id,
    title: center.title,
    citation: center.citation,
  };

  return (
    <div className="cg-selector">
      <div className="cg-selector-label">Viewing authority map for</div>
      <div className="cg-selector-wrap" ref={wrapRef}>
        <button
          ref={triggerRef}
          type="button"
          className="cg-selector-btn"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <div className="cg-selector-case">
            <span className="cg-selector-title">{selected.title}</span>
            <span className="cg-selector-cite">{selected.citation}</span>
          </div>
          <ChevronDown size={14} style={{ flexShrink: 0, color: "var(--color-faint)" }} aria-hidden="true" />
        </button>
        {open && (
          <div className="cg-selector-menu" role="listbox" aria-label="Select a case">
            {cases.map((c) => (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={c.id === selectedId}
                className="cg-selector-option"
                onClick={() => {
                  onSelect(c.id);
                  setOpen(false);
                }}
              >
                <div className="cg-selector-option-title">{c.title}</div>
                <div className="cg-selector-option-cite">{c.citation}</div>
              </button>
            ))}
          </div>
        )}
      </div>
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

function shortenLine(x1: number, y1: number, x2: number, y2: number, trimStart: number, trimEnd: number) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len, uy = dy / len;
  return {
    x1: x1 + ux * trimStart, y1: y1 + uy * trimStart,
    x2: x2 - ux * trimEnd,   y2: y2 - uy * trimEnd,
  };
}

function NetworkMap({
  center,
  citing,
  cited,
  onAction,
  onCaseSelect,
}: {
  center: CaseNode;
  citing: CaseNode[];
  cited: CaseNode[];
  onAction: (m: string) => void;
  onCaseSelect: (id: string) => void;
}) {
  const [focused, setFocused] = useState<string>(center.id);
  const detailNode =
    focused === center.id
      ? center
      : [...citing, ...cited].find((n) => n.id === focused) ?? center;

  const citingPositioned = citing.map((c, i) => ({ ...c, ...nodePosition(i, citing.length, "up") }));
  const citedPositioned = cited.map((c, i) => ({ ...c, ...nodePosition(i, cited.length, "down") }));
  const allPositioned = [...citingPositioned, ...citedPositioned];

  const selectNode = useCallback(
    (node: CaseNode) => {
      setFocused(node.id);
      onCaseSelect(node.id);
      onAction(`Focused on ${node.shortTitle}.`);
    },
    [onAction, onCaseSelect],
  );

  function handleNodeKeyDown(event: React.KeyboardEvent, node: CaseNode) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectNode(node);
    }
  }

  function renderOrbitNode(n: typeof allPositioned[number]) {
    const isFocused = focused === n.id;
    const r = isFocused ? 40 : 36;
    const isCiting = n.direction === "citing";
    const fillColor = isFocused ? TREATMENT_COLORS[n.treatment] : "var(--color-paper)";
    const lines = splitLabel(n.shortTitle);
    const lineH = 11;
    const startY = n.y - ((lines.length - 1) * lineH) / 2;
    const textFill = isFocused ? "#fff" : "var(--color-body)";
    const label = `${n.shortTitle}, ${n.treatment}, ${isCiting ? "citing this judgment" : "cited by this judgment"}`;

    return (
      <g key={n.id} className="cg-node-group">
        <circle
          cx={n.x}
          cy={n.y}
          r={r + 7}
          fill={TREATMENT_COLORS[n.treatment]}
          fillOpacity="0.07"
          aria-hidden="true"
        />
        <circle
          className="cg-node-focus-ring"
          cx={n.x}
          cy={n.y}
          r={r + 4}
          fill="none"
          stroke="transparent"
          strokeWidth={3}
          aria-hidden="true"
        />
        <foreignObject x={n.x - r} y={n.y - r} width={r * 2} height={r * 2}>
          <button
            type="button"
            className={cn("cg-node-btn", isFocused && "focused")}
            aria-label={label}
            aria-pressed={isFocused}
            onFocus={() => setFocused(n.id)}
            onClick={() => selectNode(n)}
            onKeyDown={(e) => handleNodeKeyDown(e, n)}
          >
            <span className="sr-only">{label}</span>
          </button>
        </foreignObject>
        <circle
          cx={n.x}
          cy={n.y}
          r={r}
          fill={fillColor}
          stroke={TREATMENT_COLORS[n.treatment]}
          strokeWidth={isFocused ? 0 : 2}
          strokeDasharray={isCiting && !isFocused ? "5 3" : undefined}
          pointerEvents="none"
        />
        <text
          x={n.x}
          y={startY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="8.5"
          fontWeight="700"
          fontFamily="var(--font-sans)"
          fill={textFill}
          pointerEvents="none"
          aria-hidden="true"
        >
          {lines.map((line, i) => (
            <tspan key={i} x={n.x} dy={i === 0 ? 0 : lineH}>
              {line}
            </tspan>
          ))}
        </text>
      </g>
    );
  }

  return (
    <div className="cg-network-wrap">
      <div className="cg-svg-area">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="cg-svg"
          role="img"
          aria-labelledby="cg-network-title cg-network-desc"
        >
          <title id="cg-network-title">Citation network for {center.title}</title>
          <desc id="cg-network-desc">
            {citing.length} case{citing.length !== 1 ? "s" : ""} cite this judgment; {cited.length}{" "}
            authorit{cited.length !== 1 ? "ies are" : "y is"} cited by it. Use Tab to reach each node and
            Enter to select.
          </desc>
          <defs>
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

          {citingPositioned.map((n) => {
            const e = shortenLine(n.x, n.y, CX, CY, 36, 57);
            const fade = focused === center.id || focused === n.id;
            return (
              <line
                key={`edge-${n.id}`}
                x1={e.x1}
                y1={e.y1}
                x2={e.x2}
                y2={e.y2}
                stroke={TREATMENT_COLORS[n.treatment]}
                strokeWidth={focused === n.id ? 2.5 : 1.5}
                strokeOpacity={fade ? 0.75 : 0.18}
                markerEnd={`url(#arrow-${n.treatment})`}
                className="cg-edge"
              />
            );
          })}

          {citedPositioned.map((n) => {
            const e = shortenLine(CX, CY, n.x, n.y, 57, 36);
            const fade = focused === center.id || focused === n.id;
            return (
              <line
                key={`edge-${n.id}`}
                x1={e.x1}
                y1={e.y1}
                x2={e.x2}
                y2={e.y2}
                stroke={TREATMENT_COLORS[n.treatment]}
                strokeWidth={focused === n.id ? 2.5 : 1.5}
                strokeOpacity={fade ? 0.75 : 0.18}
                markerEnd={`url(#arrow-${n.treatment})`}
                className="cg-edge"
              />
            );
          })}

          {allPositioned.map(renderOrbitNode)}

          <g className="cg-node-group">
            <circle cx={CX} cy={CY} r={58} fill="none" stroke="transparent" strokeWidth={3} aria-hidden="true" />
            <foreignObject x={CX - 54} y={CY - 54} width={108} height={108}>
              <button
                type="button"
                className={cn("cg-node-btn cg-node-btn-center", focused === center.id && "focused")}
                aria-label={`${center.shortTitle}, focus case`}
                aria-pressed={focused === center.id}
                onFocus={() => setFocused(center.id)}
                onClick={() => selectNode(center)}
                onKeyDown={(e) => handleNodeKeyDown(e, center)}
              >
                <span className="sr-only">{center.title}, focus case</span>
              </button>
            </foreignObject>
            <circle cx={CX} cy={CY} r={54} fill="var(--color-g-800)" pointerEvents="none" />
            {(() => {
              const lines = splitLabel(center.shortTitle, 13);
              const lineH = 13;
              const startY = CY - ((lines.length - 1) * lineH) / 2;
              return (
                <text
                  x={CX}
                  y={startY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="10.5"
                  fontWeight="700"
                  fontFamily="var(--font-sans)"
                  fill="rgba(255,255,255,0.92)"
                  pointerEvents="none"
                  aria-hidden="true"
                >
                  {lines.map((line, i) => (
                    <tspan key={i} x={CX} dy={i === 0 ? 0 : lineH}>
                      {line}
                    </tspan>
                  ))}
                </text>
              );
            })()}
          </g>

          <text x={CX} y={16} textAnchor="middle" className="cg-label-text" aria-hidden="true">
            CITING THIS JUDGMENT
          </text>
          <text x={CX} y={SVG_H - 6} textAnchor="middle" className="cg-label-text" aria-hidden="true">
            CITED IN THIS JUDGMENT
          </text>
        </svg>

        <div className="sr-only" aria-live="polite">
          <h3>Citation relationships</h3>
          <p>
            Focus case: {center.title} ({center.citation}).
          </p>
          <section>
            <h4>Citing this judgment ({citing.length})</h4>
            <ul>
              {citing.map((n) => (
                <li key={n.id}>
                  {n.title} — {n.treatment} — {n.citation}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h4>Cited by this judgment ({cited.length})</h4>
            <ul>
              {cited.map((n) => (
                <li key={n.id}>
                  {n.title} — {n.treatment} — {n.citation}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="cg-legend">
          <div className="cg-legend-group">
            <span className="cg-legend-label">Direction</span>
            <div className="cg-legend-items">
              <div className="cg-legend-item">
                <svg width="26" height="10" aria-hidden="true">
                  <line x1="0" y1="5" x2="20" y2="5" stroke="var(--color-muted)" strokeWidth="1.5" strokeDasharray="5 3"/>
                </svg>
                <span>Citing</span>
              </div>
              <div className="cg-legend-item">
                <svg width="26" height="10" aria-hidden="true">
                  <line x1="0" y1="5" x2="20" y2="5" stroke="var(--color-muted)" strokeWidth="1.5"/>
                </svg>
                <span>Cited</span>
              </div>
            </div>
          </div>
          <div className="cg-legend-group">
            <span className="cg-legend-label">Treatment</span>
            <div className="cg-legend-items">
              {(Object.entries(TREATMENT_COLORS) as [Treatment, string][]).map(([t, c]) => (
                <div className="cg-legend-item" key={t}>
                  <span className="cg-legend-dot" style={{ background: c }} />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="cg-detail-panel">
        {detailNode ? (
          <>
            <div className="cg-detail-direction">
              {detailNode.direction === "citing"
                ? "▲ Cites this judgment"
                : detailNode.direction === "cited"
                  ? "▼ Cited by this judgment"
                  : "● Focus case"}
            </div>
            <div className={cn("treatment-pill", tcls[detailNode.treatment])} style={{ marginBottom: 10 }}>
              {detailNode.treatment}
            </div>
            <div className="cg-detail-title">{detailNode.title}</div>
            <div className="cg-detail-cite">{detailNode.citation}</div>
            <div className="cg-detail-meta">{detailNode.court} · {detailNode.year}</div>
            <div className="cg-detail-divider" />
            <div className="cg-detail-context-label">Citation context</div>
            <div className="cg-detail-context">{detailNode.context}</div>
          </>
        ) : (
          <div className="cg-detail-empty">
            <div className="cg-detail-empty-icon" aria-hidden="true">◎</div>
            <div>Select a node to see citation details</div>
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

function AuthorityChain({
  citing,
  cited,
  summary,
}: {
  citing: CaseNode[];
  cited: CaseNode[];
  summary: CitationGraphData["summary"];
}) {
  return (
    <div className="cg-chain-wrap">
      <div className="chain-summary-bar">
        <div className="chain-summary-item">
          <div className="chain-summary-num">{summary.citingCount}</div>
          <div className="chain-summary-desc">cases citing this judgment</div>
        </div>
        <div className="chain-summary-divider" />
        <div className="chain-summary-item">
          <div className="chain-summary-num">{summary.followedCiting}</div>
          <div className="chain-summary-desc">citing with Followed treatment</div>
        </div>
        <div className="chain-summary-divider" />
        <div className="chain-summary-item">
          <div className="chain-summary-num">{summary.citedCount}</div>
          <div className="chain-summary-desc">authorities drawn on</div>
        </div>
        <div className="chain-summary-divider" />
        <div className="chain-summary-item">
          <div className="chain-summary-num">{summary.followedCited}</div>
          <div className="chain-summary-desc">cited authorities followed</div>
        </div>
      </div>

      <div className="chain-cols">
        <div className="chain-col">
          <div className="chain-col-header">
            <div className="chain-col-title">Citing this judgment</div>
            <div className="chain-col-subtitle">Cases that rely on this authority</div>
          </div>
          <div className="chain-list">
            {citing.map(n => <ChainRow key={n.id} node={n} />)}
          </div>
        </div>

        <div className="chain-col">
          <div className="chain-col-header">
            <div className="chain-col-title">Cited by this judgment</div>
            <div className="chain-col-subtitle">Authorities this judgment draws on</div>
          </div>
          <div className="chain-list">
            {cited.map(n => <ChainRow key={n.id} node={n} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function TimelineView({ timeline, centerTitle }: { timeline: TimelineEvent[]; centerTitle: string }) {
  const totals = timeline.reduce((acc, e) => {
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
      <div className="tl-stats-bar">
        <div className="tl-stat">
          <div className="tl-stat-num">{timeline.length}</div>
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
            {(totals["Followed"] || 0) >= timeline.length / 2 ? "Strong authority" : "Authority contested"}
          </div>
        </div>
      </div>

      <div className="tl-events">
        {timeline.map((e, idx) => {
          const isOrigin = e.caseTitle === centerTitle;
          return (
            <div key={e.id} className={cn("tl-event", isOrigin && "is-origin")}>
              <div className="tl-event-left">
                <div className="tl-event-date">{e.date}</div>
                <div className="tl-event-court">{e.court}</div>
              </div>
              <div className="tl-event-spine">
                <div className={cn("tl-event-dot", tcls[e.treatment], isOrigin && "origin")} />
                {idx < timeline.length - 1 && <div className="tl-event-line" />}
              </div>
              <div className="tl-event-body">
                <div className="tl-event-top">
                  <span className={cn("treatment-pill", tcls[e.treatment])}>{e.treatment}</span>
                  {isOrigin && <span className="tl-origin-badge">Origin judgment</span>}
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

// ─── Graph body ───────────────────────────────────────────────────────────────

function CitationGraphBody({
  graph,
  cases,
  caseId,
  onCaseSelect,
  onAction,
}: {
  graph: CitationGraphData;
  cases: CaseIndexItem[];
  caseId: string;
  onCaseSelect: (id: string) => void;
  onAction: (m: string) => void;
}) {
  const [tab, setTab] = useState<GraphTab>("network");

  const tabs: { id: GraphTab; label: string }[] = [
    { id: "network",  label: "Network map" },
    { id: "chain",    label: "Authority chain" },
    { id: "timeline", label: "Timeline" },
  ];

  return (
    <div className="cg-shell">
      <div className="cg-header">
        <div className="cg-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={cn("studio-tab", tab === t.id && "active")}
              aria-current={tab === t.id ? "page" : undefined}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <CaseSelector
          cases={cases}
          selectedId={caseId}
          center={graph.center}
          onSelect={onCaseSelect}
        />
      </div>

      <div className="cg-body">
        {tab === "network" && (
          <NetworkMap
            center={graph.center}
            citing={graph.citing}
            cited={graph.cited}
            onAction={onAction}
            onCaseSelect={onCaseSelect}
          />
        )}
        {tab === "chain" && (
          <AuthorityChain citing={graph.citing} cited={graph.cited} summary={graph.summary} />
        )}
        {tab === "timeline" && <TimelineView timeline={graph.timeline} centerTitle={graph.center.title} />}
      </div>
    </div>
  );
}

// ─── Citation Graph (main export) ─────────────────────────────────────────────

export function CitationGraph({
  caseId,
  cases,
  onCaseSelect,
  onAction,
}: {
  caseId: string;
  cases: CaseIndexItem[];
  onCaseSelect: (id: string) => void;
  onAction: (m: string) => void;
}) {
  const graphQuery = useApiQuery(`citation-graph:${caseId}`, () =>
    casesApi.citationGraph(caseId),
  );

  return (
    <AsyncSection query={graphQuery} loadingLabel="Loading citation graph…">
      {(graph) => (
        <CitationGraphBody
          graph={graph}
          cases={cases}
          caseId={caseId}
          onCaseSelect={onCaseSelect}
          onAction={onAction}
        />
      )}
    </AsyncSection>
  );
}
