"use client";

import React, { useState } from "react";
import {
  Plus, ChevronDown, ChevronRight, Trash2,
  ArrowUp, ArrowDown, FileText, Download, AlignLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Treatment = "Followed" | "Distinguished" | "Overruled" | "Questioned";

type SavedCase = {
  id: string;
  title: string;
  citation: string;
  court: string;
  year: number;
  treatment: Treatment;
};

type Issue = {
  id: string;
  text: string;
  authorities: string[];
  submission: string;
  expanded: boolean;
};

type Brief = {
  court: string;
  location: string;
  suitNo: string;
  appellant: string;
  respondent: string;
  intro: string;
  conclusion: string;
  relief: string;
};

// ─── Mock saved cases ─────────────────────────────────────────────────────────

const SAVED: SavedCase[] = [
  {
    id: "SC-2034",
    title: "Zenith Trustees Ltd v. Adebayo & Sons Holdings",
    citation: "(2026) 4 LRR 221 (SC)",
    court: "Supreme Court",
    year: 2026,
    treatment: "Followed",
  },
  {
    id: "CA-1188",
    title: "Attorney-General of Lagos State v. Westbridge Mobility Plc",
    citation: "(2025) 19 LRR 73 (CA)",
    court: "Court of Appeal",
    year: 2025,
    treatment: "Distinguished",
  },
  {
    id: "NIC-441",
    title: "Okorie v. Meridian Energy Services",
    citation: "(2026) 2 LRR 590 (NICN)",
    court: "National Industrial Court",
    year: 2026,
    treatment: "Followed",
  },
];

const tcls: Record<Treatment, string> = {
  Followed: "followed",
  Distinguished: "distinguished",
  Questioned: "questioned",
  Overruled: "overruled",
};

// ─── Notepad ──────────────────────────────────────────────────────────────────

function Notepad({ c, note, onChange }: { c: SavedCase; note: string; onChange: (v: string) => void }) {
  const words = note.trim() ? note.trim().split(/\s+/).length : 0;
  return (
    <div className="notepad">
      <div className="notepad-header">
        <div className="notepad-case-label">Research note</div>
        <div className="notepad-case-title">{c.title}</div>
        <div className="notepad-case-cite">{c.citation}</div>
        <div className="notepad-meta">Saved 2 June 2026</div>
      </div>
      <textarea
        className="notepad-body"
        placeholder="Add your notes — key passages, relevance to the matter, points to raise in submissions…"
        value={note}
        onChange={e => onChange(e.target.value)}
      />
      <div className="notepad-footer">
        {words > 0 ? `${words} word${words === 1 ? "" : "s"}` : "No notes yet"}
      </div>
    </div>
  );
}

// ─── Cases sidebar ────────────────────────────────────────────────────────────

function CasesSidebar({
  cases,
  notes,
  onNoteChange,
  expandedNote,
  setExpandedNote,
  onAddToIssue,
  activeIssueId,
}: {
  cases: SavedCase[];
  notes: Record<string, string>;
  onNoteChange: (id: string, v: string) => void;
  expandedNote: string | null;
  setExpandedNote: (id: string | null) => void;
  onAddToIssue: (caseId: string) => void;
  activeIssueId: string | null;
}) {
  return (
    <aside className="studio-sidebar">
      <div className="studio-sidebar-label">Saved cases · {cases.length}</div>
      <div className="studio-case-list">
        {cases.map(c => {
          const open = expandedNote === c.id;
          return (
            <div className={cn("studio-case-item", open && "open")} key={c.id}>
              <div className="studio-case-row">
                <div className="studio-case-info">
                  <div className="studio-case-name">{c.title}</div>
                  <div className="studio-case-cite">{c.citation}</div>
                  <div className="studio-case-meta">
                    <span className={cn("treatment-pill", tcls[c.treatment])}>{c.treatment}</span>
                    {activeIssueId && (
                      <button
                        className="btn btn-xs studio-add-auth"
                        onClick={() => onAddToIssue(c.id)}
                        title="Add to active issue"
                      >
                        + Add to issue
                      </button>
                    )}
                  </div>
                </div>
                <button
                  className={cn("studio-note-toggle", open && "open")}
                  onClick={() => setExpandedNote(open ? null : c.id)}
                  title={open ? "Collapse note" : "Open note"}
                >
                  <AlignLeft size={13} />
                </button>
              </div>
              {open && (
                <Notepad
                  c={c}
                  note={notes[c.id] ?? ""}
                  onChange={v => onNoteChange(c.id, v)}
                />
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

// ─── Arguments tab ────────────────────────────────────────────────────────────

function ArgumentsTab({
  issues,
  setIssues,
  savedCases,
  activeIssueId,
  setActiveIssueId,
  onAction,
}: {
  issues: Issue[];
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  savedCases: SavedCase[];
  activeIssueId: string | null;
  setActiveIssueId: (id: string | null) => void;
  onAction: (m: string) => void;
}) {
  function addIssue() {
    const id = `i${Date.now()}`;
    setIssues(prev => [...prev, { id, text: "", authorities: [], submission: "", expanded: true }]);
  }

  function updateIssue(id: string, patch: Partial<Issue>) {
    setIssues(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  }

  function removeIssue(id: string) {
    setIssues(prev => prev.filter(i => i.id !== id));
    if (activeIssueId === id) setActiveIssueId(null);
  }

  function removeAuthority(issueId: string, caseId: string) {
    setIssues(prev => prev.map(i => i.id === issueId
      ? { ...i, authorities: i.authorities.filter(a => a !== caseId) }
      : i
    ));
  }

  function toggleExpanded(id: string) {
    setIssues(prev => prev.map(i => i.id === id ? { ...i, expanded: !i.expanded } : i));
  }

  return (
    <div className="tab-content">
      <div className="tab-section-header">
        <div>
          <div className="label">Step 1 of 3</div>
          <h3 className="studio-section-title">Issues for determination</h3>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={addIssue}>
          <Plus size={12} /> Add issue
        </button>
      </div>
      <p className="studio-hint">
        State each issue, add authorities from your saved cases, then write your submissions. Click an issue to make it active — then click "Add to issue" on a saved case in the sidebar.
      </p>

      <div className="issues-list">
        {issues.map((issue, idx) => {
          const isActive = activeIssueId === issue.id;
          return (
            <div key={issue.id} className={cn("issue-card", isActive && "active")} onClick={() => setActiveIssueId(isActive ? null : issue.id)}>
              <div className="issue-card-head">
                <div className="issue-num display">{String(idx + 1).padStart(2, "0")}</div>
                <input
                  className="issue-text-input"
                  placeholder="State the issue for determination…"
                  value={issue.text}
                  onChange={e => updateIssue(issue.id, { text: e.target.value })}
                  onClick={e => e.stopPropagation()}
                />
                <div className="issue-head-actions" onClick={e => e.stopPropagation()}>
                  <button className="icon-btn" onClick={() => toggleExpanded(issue.id)} title={issue.expanded ? "Collapse" : "Expand"}>
                    {issue.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <button className="icon-btn danger" onClick={() => removeIssue(issue.id)} title="Remove issue">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {issue.expanded && (
                <div className="issue-body" onClick={e => e.stopPropagation()}>
                  <div className="issue-subsection-label">Authorities</div>
                  {issue.authorities.length === 0 ? (
                    <div className="issue-auth-empty">
                      No authorities yet — select a saved case and click "Add to issue"
                    </div>
                  ) : (
                    <div className="issue-auth-list">
                      {issue.authorities.map(cid => {
                        const c = savedCases.find(s => s.id === cid);
                        if (!c) return null;
                        return (
                          <div className="issue-auth-item" key={cid}>
                            <div className="issue-auth-info">
                              <span className={cn("treatment-pill", tcls[c.treatment])}>{c.treatment}</span>
                              <span className="issue-auth-name">{c.title}</span>
                              <span className="issue-auth-cite">{c.citation}</span>
                            </div>
                            <button className="icon-btn danger" onClick={() => removeAuthority(issue.id, cid)}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="issue-subsection-label" style={{ marginTop: 14 }}>Submissions</div>
                  <textarea
                    className="submission-area"
                    placeholder="Write your submissions on this issue in response to the authorities above…"
                    value={issue.submission}
                    onChange={e => updateIssue(issue.id, { submission: e.target.value })}
                    rows={4}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {issues.length > 0 && (
        <div className="tab-actions">
          <button className="btn btn-primary" onClick={() => onAction("Argument outline generated and saved.")}>
            Generate argument outline <FileText size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Bundle tab ───────────────────────────────────────────────────────────────

function BundleTab({
  savedCases,
  bundleOrder,
  setBundleOrder,
  onAction,
}: {
  savedCases: SavedCase[];
  bundleOrder: string[];
  setBundleOrder: React.Dispatch<React.SetStateAction<string[]>>;
  onAction: (m: string) => void;
}) {
  const [details, setDetails] = useState({ court: "Supreme Court", location: "Abuja", suitNo: "", appellant: "", respondent: "" });

  function move(id: string, dir: -1 | 1) {
    setBundleOrder(prev => {
      const idx = prev.indexOf(id);
      if (idx === -1) return prev;
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }

  function remove(id: string) {
    setBundleOrder(prev => prev.filter(i => i !== id));
  }

  const ordered = bundleOrder.map(id => savedCases.find(c => c.id === id)).filter(Boolean) as SavedCase[];

  return (
    <div className="tab-content">
      <div className="tab-section-header">
        <div>
          <div className="label">Step 2 of 3</div>
          <h3 className="studio-section-title">Court bundle</h3>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => onAction("PDF bundle exported.")}>
          <Download size={12} /> Export PDF
        </button>
      </div>
      <p className="studio-hint">
        Arrange your cases in the order you want them to appear in the bundle. Fill in the suit details — these will appear on the bundle cover.
      </p>

      <div className="bundle-grid">
        <div className="bundle-details-panel">
          <div className="studio-subsection-title">Suit details</div>
          {([
            ["court", "Court"],
            ["location", "Holden at"],
            ["suitNo", "Suit number"],
            ["appellant", "Appellant / Claimant"],
            ["respondent", "Respondent / Defendant"],
          ] as [keyof typeof details, string][]).map(([key, label]) => (
            <div className="bundle-field" key={key}>
              <label className="form-label">{label}</label>
              <input
                className="form-input"
                value={details[key]}
                onChange={e => setDetails(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={label}
              />
            </div>
          ))}
        </div>

        <div className="bundle-cases-panel">
          <div className="studio-subsection-title">Cases · {ordered.length}</div>
          {ordered.length === 0 ? (
            <div className="bundle-empty">No cases in bundle. Add cases from your research.</div>
          ) : (
            <div className="bundle-list">
              {ordered.map((c, idx) => (
                <div className="bundle-item" key={c.id}>
                  <div className="bundle-item-num display">{idx + 1}</div>
                  <div className="bundle-item-info">
                    <div className="bundle-item-title">{c.title}</div>
                    <div className="bundle-item-cite">{c.citation}</div>
                  </div>
                  <div className="bundle-item-actions">
                    <button className="icon-btn" onClick={() => move(c.id, -1)} disabled={idx === 0}><ArrowUp size={13} /></button>
                    <button className="icon-btn" onClick={() => move(c.id, 1)} disabled={idx === ordered.length - 1}><ArrowDown size={13} /></button>
                    <button className="icon-btn danger" onClick={() => remove(c.id)}><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Brief tab ────────────────────────────────────────────────────────────────

function BriefTab({ issues, onAction }: { issues: Issue[]; onAction: (m: string) => void }) {
  const [brief, setBrief] = useState<Brief>({
    court: "Supreme Court",
    location: "Abuja",
    suitNo: "SC/1234/2026",
    appellant: "",
    respondent: "",
    intro: "",
    conclusion: "",
    relief: "",
  });

  function patch(key: keyof Brief, value: string) {
    setBrief(prev => ({ ...prev, [key]: value }));
  }

  return (
    <div className="tab-content">
      <div className="tab-section-header">
        <div>
          <div className="label">Step 3 of 3</div>
          <h3 className="studio-section-title">Written address</h3>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => onAction("Written address exported.")}>
          <Download size={12} /> Export
        </button>
      </div>
      <p className="studio-hint">
        Your issues and authorities from the Arguments tab are carried over. Fill in the parties, write your arguments, and export a formatted written address.
      </p>

      <div className="brief-document">
        {/* Heading block */}
        <div className="brief-heading-block">
          <div className="brief-court-line">
            IN THE {" "}
            <input className="brief-inline-input" value={brief.court} onChange={e => patch("court", e.target.value)} placeholder="COURT NAME" />
            {" "} OF NIGERIA
          </div>
          <div className="brief-court-line">
            HOLDEN AT {" "}
            <input className="brief-inline-input" value={brief.location} onChange={e => patch("location", e.target.value)} placeholder="LOCATION" />
          </div>
          <div className="brief-suit-line">
            SUIT NO: <input className="brief-inline-input" value={brief.suitNo} onChange={e => patch("suitNo", e.target.value)} placeholder="SC/0000/0000" />
          </div>
        </div>

        {/* Parties block */}
        <div className="brief-parties-block">
          <div className="brief-party-row">
            <input className="brief-party-input" value={brief.appellant} onChange={e => patch("appellant", e.target.value)} placeholder="APPELLANT / CLAIMANT" />
            <span className="brief-party-role">…APPELLANT</span>
          </div>
          <div className="brief-party-and">AND</div>
          <div className="brief-party-row">
            <input className="brief-party-input" value={brief.respondent} onChange={e => patch("respondent", e.target.value)} placeholder="RESPONDENT / DEFENDANT" />
            <span className="brief-party-role">…RESPONDENT</span>
          </div>
        </div>

        <div className="brief-doc-title">WRITTEN ADDRESS</div>

        {/* Sections */}
        <div className="brief-section">
          <div className="brief-section-heading">INTRODUCTION</div>
          <textarea className="brief-textarea" value={brief.intro} onChange={e => patch("intro", e.target.value)} placeholder="Set out the nature of the proceedings, the relief sought, and a brief summary of the facts…" rows={5} />
        </div>

        {issues.length > 0 && (
          <div className="brief-section">
            <div className="brief-section-heading">ISSUES FOR DETERMINATION</div>
            <div className="brief-issues-list">
              {issues.map((issue, idx) => (
                <div className="brief-issue-item" key={issue.id}>
                  <span className="brief-issue-num">{idx + 1}.</span>
                  <span>{issue.text || <em className="brief-placeholder">Issue not yet stated</em>}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {issues.length > 0 && (
          <div className="brief-section">
            <div className="brief-section-heading">ARGUMENTS</div>
            {issues.map((issue, idx) => (
              <div className="brief-arg-block" key={issue.id}>
                <div className="brief-arg-issue-heading">Issue {idx + 1}: {issue.text || "—"}</div>
                <div className="brief-arg-body">
                  {issue.submission
                    ? <p>{issue.submission}</p>
                    : <textarea className="brief-textarea" placeholder={`Write your argument on Issue ${idx + 1}…`} rows={4} />
                  }
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="brief-section">
          <div className="brief-section-heading">CONCLUSION</div>
          <textarea className="brief-textarea" value={brief.conclusion} onChange={e => patch("conclusion", e.target.value)} placeholder="Summarise your arguments and reiterate the relief sought…" rows={4} />
        </div>

        <div className="brief-section">
          <div className="brief-section-heading">RELIEF SOUGHT</div>
          <textarea className="brief-textarea" value={brief.relief} onChange={e => patch("relief", e.target.value)} placeholder="State precisely the orders you are inviting the court to make…" rows={4} />
        </div>

        <div className="brief-signature-block">
          <div className="brief-sig-line" />
          <div className="brief-sig-name">_______________________________</div>
          <div className="brief-sig-label">Counsel for the Appellant</div>
        </div>
      </div>
    </div>
  );
}

// ─── Draft Studio (main export) ──────────────────────────────────────────────

type StudioTab = "arguments" | "bundle" | "brief";

export function DraftStudio({ onAction }: { onAction: (m: string) => void }) {
  const [tab, setTab] = useState<StudioTab>("arguments");
  const [notes, setNotes] = useState<Record<string, string>>({
    "SC-2034": "",
    "CA-1188": "",
    "NIC-441": "",
  });
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [activeIssueId, setActiveIssueId] = useState<string | null>("i1");
  const [issues, setIssues] = useState<Issue[]>([
    {
      id: "i1",
      text: "Whether the floating charge crystallised prior to the transfer of the charged assets",
      authorities: ["SC-2034"],
      submission: "",
      expanded: true,
    },
    {
      id: "i2",
      text: "Whether notice of a debenture is sufficient to defeat the priority of a subsequent purchaser",
      authorities: ["SC-2034", "CA-1188"],
      submission: "",
      expanded: false,
    },
  ]);
  const [bundleOrder, setBundleOrder] = useState<string[]>(["SC-2034", "CA-1188", "NIC-441"]);

  function handleAddToIssue(caseId: string) {
    if (!activeIssueId) return;
    setIssues(prev => prev.map(i => {
      if (i.id !== activeIssueId) return i;
      if (i.authorities.includes(caseId)) return i;
      return { ...i, authorities: [...i.authorities, caseId] };
    }));
    onAction("Case added as authority.");
  }

  const tabs: { id: StudioTab; label: string }[] = [
    { id: "arguments", label: "Arguments" },
    { id: "bundle",    label: "Bundle" },
    { id: "brief",     label: "Written address" },
  ];

  return (
    <div className="studio-shell">
      {/* Tab bar */}
      <div className="studio-tabs">
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

      <div className="studio-body">
        <CasesSidebar
          cases={SAVED}
          notes={notes}
          onNoteChange={(id, v) => setNotes(prev => ({ ...prev, [id]: v }))}
          expandedNote={expandedNote}
          setExpandedNote={setExpandedNote}
          onAddToIssue={handleAddToIssue}
          activeIssueId={tab === "arguments" ? activeIssueId : null}
        />

        <div className="studio-main">
          {tab === "arguments" && (
            <ArgumentsTab
              issues={issues}
              setIssues={setIssues}
              savedCases={SAVED}
              activeIssueId={activeIssueId}
              setActiveIssueId={setActiveIssueId}
              onAction={onAction}
            />
          )}
          {tab === "bundle" && (
            <BundleTab
              savedCases={SAVED}
              bundleOrder={bundleOrder}
              setBundleOrder={setBundleOrder}
              onAction={onAction}
            />
          )}
          {tab === "brief" && (
            <BriefTab issues={issues} onAction={onAction} />
          )}
        </div>
      </div>
    </div>
  );
}
