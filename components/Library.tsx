"use client";

import React, { useState } from "react";
import {
  Plus, Folder, Briefcase, BookOpen, ChevronRight,
  ArrowLeft, Trash2, PenLine, Check, Clock, Users,
  Tag, Lock,
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
  savedAt: string;
  note?: string;
};

type SaveFolder = {
  id: string;
  name: string;
  color: string;
  cases: SavedCase[];
  createdAt: string;
};

type Matter = {
  id: string;
  ref: string;
  name: string;
  client: string;
  practiceArea: string;
  status: "active" | "closed";
  cases: SavedCase[];
  createdAt: string;
  lastUpdated: string;
};

type FirmCollection = {
  id: string;
  name: string;
  practiceArea: string;
  curator: string;
  curatorRole: string;
  description: string;
  cases: SavedCase[];
  suggestedCount: number;
  locked: boolean;
};

type LibTab = "saves" | "matters" | "firm";

// ─── Mock data ────────────────────────────────────────────────────────────────

const CASE_POOL: SavedCase[] = [
  {
    id: "SC-2034",
    title: "Zenith Trustees Ltd v. Adebayo & Sons Holdings",
    citation: "(2026) 4 LRR 221 (SC)",
    court: "Supreme Court", year: 2026, treatment: "Followed",
    savedAt: "2 June 2026",
    note: "Key authority on crystallisation timing — cite for priority argument in secured credit matters.",
  },
  {
    id: "CA-1188",
    title: "Attorney-General of Lagos State v. Westbridge Mobility Plc",
    citation: "(2025) 19 LRR 73 (CA)",
    court: "Court of Appeal", year: 2025, treatment: "Distinguished",
    savedAt: "1 June 2026",
    note: "Covers the field doctrine — useful counter-argument when state regulatory powers are challenged.",
  },
  {
    id: "NIC-441",
    title: "Okorie v. Meridian Energy Services",
    citation: "(2026) 2 LRR 590 (NICN)",
    court: "National Industrial Court", year: 2026, treatment: "Followed",
    savedAt: "30 May 2026",
    note: "Monitoring policy must be explicit. Good for disciplinary matters involving workplace surveillance.",
  },
];

const INIT_FOLDERS: SaveFolder[] = [
  {
    id: "f1", name: "Floating charges & priority", color: "#2d7c54",
    cases: [CASE_POOL[0], CASE_POOL[1]],
    createdAt: "28 May 2026",
  },
  {
    id: "f2", name: "Employment — data & surveillance", color: "#1c5c9e",
    cases: [CASE_POOL[2]],
    createdAt: "30 May 2026",
  },
  {
    id: "f3", name: "Constitutional / regulatory", color: "#8a5e0e",
    cases: [],
    createdAt: "1 June 2026",
  },
];

const INIT_MATTERS: Matter[] = [
  {
    id: "m1", ref: "MC/2026/0142",
    name: "Okonkwo v. Meridian Energy Services",
    client: "Chukwuemeka Okonkwo",
    practiceArea: "Employment",
    status: "active",
    cases: [CASE_POOL[2]],
    createdAt: "30 May 2026",
    lastUpdated: "2 June 2026",
  },
  {
    id: "m2", ref: "MC/2026/0119",
    name: "First Inland Bank receivership advisory",
    client: "First Inland Bank Plc",
    practiceArea: "Banking & Finance",
    status: "active",
    cases: [CASE_POOL[0], CASE_POOL[1]],
    createdAt: "21 May 2026",
    lastUpdated: "1 June 2026",
  },
  {
    id: "m3", ref: "MC/2025/0887",
    name: "Ikeja Local Government v. Westbridge",
    client: "Ikeja Local Government",
    practiceArea: "Regulatory / Constitutional",
    status: "closed",
    cases: [CASE_POOL[1]],
    createdAt: "14 Dec 2025",
    lastUpdated: "3 Feb 2026",
  },
];

const INIT_FIRM: FirmCollection[] = [
  {
    id: "fc1",
    name: "Secured lending — priority disputes",
    practiceArea: "Banking & Finance",
    curator: "Adanna Okafor",
    curatorRole: "Partner, Disputes",
    description: "Core authorities on floating charges, fixed charges, crystallisation, and priority between competing security holders. Updated after Zenith Trustees SC decision.",
    cases: [CASE_POOL[0]],
    suggestedCount: 2,
    locked: false,
  },
  {
    id: "fc2",
    name: "Employment — disciplinary procedure",
    practiceArea: "Employment",
    curator: "Babajide Adeyemi",
    curatorRole: "Partner, Employment",
    description: "Procedural fairness, workplace monitoring, termination grounds, and NLC/NICN jurisdiction. Includes post-NDPA 2023 decisions on employee data.",
    cases: [CASE_POOL[2]],
    suggestedCount: 0,
    locked: false,
  },
  {
    id: "fc3",
    name: "Constitutional — exclusive & concurrent list",
    practiceArea: "Constitutional",
    curator: "Funmi Adesanya",
    curatorRole: "Partner, Public Law",
    description: "Covering the field, section 4 exclusivity, concurrent regulatory powers. Curated for election and regulatory mandates.",
    cases: [CASE_POOL[1]],
    suggestedCount: 5,
    locked: true,
  },
];

const tcls: Record<Treatment, string> = {
  Followed: "followed", Distinguished: "distinguished",
  Questioned: "questioned", Overruled: "overruled",
};

const FOLDER_COLORS = ["#2d7c54", "#1c5c9e", "#8a5e0e", "#9a3244", "#4a4a7c", "#6b7068"];

// ─── Shared case row ──────────────────────────────────────────────────────────

function CaseRow({ c, onRemove, showNote = true }: { c: SavedCase; onRemove?: () => void; showNote?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("lib-case-row", open && "open")}>
      <div className="lib-case-row-main">
        <div className="lib-case-row-info">
          <span className={cn("treatment-pill", tcls[c.treatment])}>{c.treatment}</span>
          <div className="lib-case-row-title">{c.title}</div>
          <div className="lib-case-row-cite">{c.citation}</div>
        </div>
        <div className="lib-case-row-actions">
          <span className="lib-case-row-date"><Clock size={11} /> {c.savedAt}</span>
          {showNote && (
            <button
              className={cn("icon-btn", open && "active-tint")}
              onClick={() => setOpen(v => !v)}
              title={open ? "Hide note" : "Show note"}
            >
              <PenLine size={13} />
            </button>
          )}
          {onRemove && (
            <button className="icon-btn danger" onClick={onRemove} title="Remove from collection">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
      {open && (
        <div className="lib-case-note">
          {c.note
            ? <p>{c.note}</p>
            : <span className="lib-case-note-empty">No note added for this case.</span>
          }
        </div>
      )}
    </div>
  );
}

// ─── My Saves tab ─────────────────────────────────────────────────────────────

function MySaves({ onAction }: { onAction: (m: string) => void }) {
  const [folders, setFolders] = useState<SaveFolder[]>(INIT_FOLDERS);
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(FOLDER_COLORS[0]);

  const activeFolder = folders.find(f => f.id === open) ?? null;

  function createFolder() {
    if (!newName.trim()) return;
    const f: SaveFolder = {
      id: `f${Date.now()}`, name: newName.trim(), color: newColor,
      cases: [], createdAt: "2 June 2026",
    };
    setFolders(prev => [...prev, f]);
    setNewName(""); setCreating(false);
    onAction(`Folder "${f.name}" created.`);
  }

  function deleteFolder(id: string) {
    setFolders(prev => prev.filter(f => f.id !== id));
    if (open === id) setOpen(null);
  }

  function removeCase(folderId: string, caseId: string) {
    setFolders(prev => prev.map(f =>
      f.id === folderId ? { ...f, cases: f.cases.filter(c => c.id !== caseId) } : f
    ));
  }

  if (activeFolder) {
    return (
      <div className="lib-view">
        <div className="lib-view-header">
          <button className="btn btn-link btn-sm" onClick={() => setOpen(null)}>
            <ArrowLeft size={13} /> My saves
          </button>
          <div className="lib-view-title-row">
            <div className="lib-folder-dot" style={{ background: activeFolder.color }} />
            <h3 className="lib-view-title">{activeFolder.name}</h3>
            <span className="lib-view-count">{activeFolder.cases.length} case{activeFolder.cases.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
        {activeFolder.cases.length === 0 ? (
          <div className="lib-empty">No cases in this folder yet. Save cases from your research to add them here.</div>
        ) : (
          <div className="lib-case-list">
            {activeFolder.cases.map(c => (
              <CaseRow key={c.id} c={c} onRemove={() => removeCase(activeFolder.id, c.id)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="lib-view">
      <div className="lib-view-header flat">
        <h3 className="lib-view-title">My saves</h3>
        <button className="btn btn-secondary btn-sm" onClick={() => setCreating(true)}>
          <Plus size={12} /> New folder
        </button>
      </div>

      {creating && (
        <div className="lib-create-panel">
          <div className="lib-create-row">
            <div className="lib-color-picker">
              {FOLDER_COLORS.map(col => (
                <button
                  key={col}
                  className={cn("lib-color-dot", newColor === col && "selected")}
                  style={{ background: col }}
                  onClick={() => setNewColor(col)}
                />
              ))}
            </div>
            <input
              className="form-input"
              style={{ flex: 1 }}
              placeholder="Folder name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createFolder()}
              autoFocus
            />
            <button className="btn btn-primary btn-sm" onClick={createFolder} disabled={!newName.trim()}>
              <Check size={12} /> Create
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="lib-folder-grid">
        {folders.map(f => (
          <div key={f.id} className="lib-folder-card" onClick={() => setOpen(f.id)}>
            <div className="lib-folder-card-top">
              <div className="lib-folder-icon" style={{ background: f.color + "18", borderColor: f.color + "30" }}>
                <Folder size={18} style={{ color: f.color }} />
              </div>
              <button
                className="icon-btn danger lib-folder-delete"
                onClick={e => { e.stopPropagation(); deleteFolder(f.id); }}
                title="Delete folder"
              >
                <Trash2 size={12} />
              </button>
            </div>
            <div className="lib-folder-name">{f.name}</div>
            <div className="lib-folder-meta">
              <span>{f.cases.length} case{f.cases.length !== 1 ? "s" : ""}</span>
              <span>Created {f.createdAt}</span>
            </div>
            <div className="lib-folder-arrow"><ChevronRight size={14} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Matters tab ──────────────────────────────────────────────────────────────

function Matters({ onOpenInStudio, onAction }: { onOpenInStudio: () => void; onAction: (m: string) => void }) {
  const [matters, setMatters] = useState<Matter[]>(INIT_MATTERS);
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", client: "", ref: "", practiceArea: "" });
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">("all");

  const activeMatter = matters.find(m => m.id === open) ?? null;
  const filtered = matters.filter(m => statusFilter === "all" || m.status === statusFilter);

  function createMatter() {
    if (!form.name.trim() || !form.client.trim()) return;
    const m: Matter = {
      id: `m${Date.now()}`,
      ref: form.ref || `MC/2026/${String(matters.length + 1).padStart(4, "0")}`,
      name: form.name.trim(),
      client: form.client.trim(),
      practiceArea: form.practiceArea.trim() || "General",
      status: "active",
      cases: [],
      createdAt: "2 June 2026",
      lastUpdated: "2 June 2026",
    };
    setMatters(prev => [m, ...prev]);
    setForm({ name: "", client: "", ref: "", practiceArea: "" });
    setCreating(false);
    onAction(`Matter "${m.name}" created.`);
  }

  function removeCase(matterId: string, caseId: string) {
    setMatters(prev => prev.map(m =>
      m.id === matterId ? { ...m, cases: m.cases.filter(c => c.id !== caseId) } : m
    ));
  }

  if (activeMatter) {
    return (
      <div className="lib-view">
        <div className="lib-view-header">
          <button className="btn btn-link btn-sm" onClick={() => setOpen(null)}>
            <ArrowLeft size={13} /> Matters
          </button>
          <div className="matter-detail-header">
            <div className="matter-detail-ref">{activeMatter.ref}</div>
            <h3 className="lib-view-title">{activeMatter.name}</h3>
            <div className="matter-detail-meta">
              <span><Users size={11} /> {activeMatter.client}</span>
              <span><Tag size={11} /> {activeMatter.practiceArea}</span>
              <span className={cn("matter-status-pill", activeMatter.status)}>{activeMatter.status}</span>
            </div>
          </div>
          <button className="btn btn-primary btn-sm matter-studio-btn" onClick={() => { onOpenInStudio(); onAction(`Opened ${activeMatter.name} in Draft Studio.`); }}>
            <PenLine size={12} /> Open in Draft Studio
          </button>
        </div>

        <div className="matter-cases-header">
          <span className="studio-subsection-title" style={{ margin: 0 }}>
            Research · {activeMatter.cases.length} case{activeMatter.cases.length !== 1 ? "s" : ""}
          </span>
          <button className="btn btn-ghost btn-xs" onClick={() => onAction("Add cases panel opened.")}>
            <Plus size={11} /> Add from research
          </button>
        </div>

        {activeMatter.cases.length === 0 ? (
          <div className="lib-empty">No cases saved to this matter yet. Find cases in Research and save them here.</div>
        ) : (
          <div className="lib-case-list">
            {activeMatter.cases.map(c => (
              <CaseRow key={c.id} c={c} onRemove={() => removeCase(activeMatter.id, c.id)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="lib-view">
      <div className="lib-view-header flat">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h3 className="lib-view-title">Matters</h3>
          <div className="lib-filter-strip">
            {(["all", "active", "closed"] as const).map(s => (
              <button
                key={s}
                className={cn("lib-filter-btn", statusFilter === s && "active")}
                onClick={() => setStatusFilter(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setCreating(true)}>
          <Plus size={12} /> New matter
        </button>
      </div>

      {creating && (
        <div className="lib-create-panel">
          <div className="matter-create-form">
            <div className="matter-form-row">
              <div className="form-field" style={{ flex: 2 }}>
                <label className="form-label">Matter name *</label>
                <input className="form-input" placeholder="e.g. Okonkwo v. Meridian Energy" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label">Matter reference</label>
                <input className="form-input" placeholder="MC/2026/0000" value={form.ref} onChange={e => setForm(p => ({ ...p, ref: e.target.value }))} />
              </div>
            </div>
            <div className="matter-form-row">
              <div className="form-field" style={{ flex: 2 }}>
                <label className="form-label">Client *</label>
                <input className="form-input" placeholder="Client name" value={form.client} onChange={e => setForm(p => ({ ...p, client: e.target.value }))} />
              </div>
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label">Practice area</label>
                <input className="form-input" placeholder="e.g. Banking & Finance" value={form.practiceArea} onChange={e => setForm(p => ({ ...p, practiceArea: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setCreating(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={createMatter} disabled={!form.name.trim() || !form.client.trim()}>
                <Check size={12} /> Create matter
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="matters-list">
        {filtered.map(m => (
          <div key={m.id} className={cn("matter-card", m.status === "closed" && "closed")} onClick={() => setOpen(m.id)}>
            <div className="matter-card-top">
              <div className="matter-card-left">
                <div className="matter-ref">{m.ref}</div>
                <div className="matter-name">{m.name}</div>
                <div className="matter-client"><Users size={11} /> {m.client}</div>
              </div>
              <div className="matter-card-right">
                <span className={cn("matter-status-pill", m.status)}>{m.status}</span>
              </div>
            </div>
            <div className="matter-card-footer">
              <span><Tag size={11} /> {m.practiceArea}</span>
              <span><BookOpen size={11} /> {m.cases.length} case{m.cases.length !== 1 ? "s" : ""}</span>
              <span><Clock size={11} /> Updated {m.lastUpdated}</span>
              <button className="matter-studio-link" onClick={e => { e.stopPropagation(); onOpenInStudio(); onAction(`Opened ${m.name} in Draft Studio.`); }}>
                <PenLine size={12} /> Open in Draft Studio
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Firm Library tab ─────────────────────────────────────────────────────────

function FirmLibrary({ onAction }: { onAction: (m: string) => void }) {
  const [collections, setCollections] = useState<FirmCollection[]>(INIT_FIRM);
  const [open, setOpen] = useState<string | null>(null);
  const [areaFilter, setAreaFilter] = useState("All");

  const activeCol = collections.find(c => c.id === open) ?? null;
  const areas = ["All", ...Array.from(new Set(collections.map(c => c.practiceArea)))];
  const filtered = collections.filter(c => areaFilter === "All" || c.practiceArea === areaFilter);

  function approveSuggestion(colId: string) {
    setCollections(prev => prev.map(c =>
      c.id === colId && c.suggestedCount > 0
        ? { ...c, suggestedCount: c.suggestedCount - 1 }
        : c
    ));
    onAction("Suggested case approved and added to collection.");
  }

  if (activeCol) {
    return (
      <div className="lib-view">
        <div className="lib-view-header">
          <button className="btn btn-link btn-sm" onClick={() => setOpen(null)}>
            <ArrowLeft size={13} /> Firm library
          </button>
          <div className="firm-col-header">
            <div className="firm-col-area">{activeCol.practiceArea}</div>
            <h3 className="lib-view-title">
              {activeCol.name}
              {activeCol.locked && <Lock size={14} style={{ marginLeft: 8, color: "var(--color-faint)", display: "inline", verticalAlign: "middle" }} />}
            </h3>
            <div className="firm-col-meta">
              <span>Curated by {activeCol.curator} · {activeCol.curatorRole}</span>
            </div>
            <p className="firm-col-desc">{activeCol.description}</p>
          </div>
          {activeCol.suggestedCount > 0 && (
            <div className="firm-suggested-banner">
              <span>{activeCol.suggestedCount} case{activeCol.suggestedCount !== 1 ? "s" : ""} suggested by associates — awaiting approval</span>
              <button className="btn btn-primary btn-xs" onClick={() => approveSuggestion(activeCol.id)}>
                <Check size={11} /> Review suggestions
              </button>
            </div>
          )}
        </div>
        {activeCol.cases.length === 0 ? (
          <div className="lib-empty">No cases in this collection yet.</div>
        ) : (
          <div className="lib-case-list">
            {activeCol.cases.map(c => (
              <CaseRow key={c.id} c={c} showNote={false} />
            ))}
          </div>
        )}
        {!activeCol.locked && (
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => onAction("Case suggestion submitted for partner approval.")}>
              <Plus size={12} /> Suggest a case
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="lib-view">
      <div className="lib-view-header flat">
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h3 className="lib-view-title">Firm library</h3>
          <div className="lib-filter-strip">
            {areas.map(a => (
              <button
                key={a}
                className={cn("lib-filter-btn", areaFilter === a && "active")}
                onClick={() => setAreaFilter(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => onAction("New collection created.")}>
          <Plus size={12} /> New collection
        </button>
      </div>

      <div className="firm-grid">
        {filtered.map(col => (
          <div key={col.id} className="firm-card" onClick={() => setOpen(col.id)}>
            <div className="firm-card-top">
              <div className="firm-card-area">{col.practiceArea}</div>
              {col.locked && <Lock size={12} style={{ color: "var(--color-faint)" }} />}
              {col.suggestedCount > 0 && (
                <div className="firm-suggestion-badge">{col.suggestedCount} pending</div>
              )}
            </div>
            <div className="firm-card-name">{col.name}</div>
            <div className="firm-card-desc">{col.description}</div>
            <div className="firm-card-footer">
              <span>{col.cases.length} case{col.cases.length !== 1 ? "s" : ""}</span>
              <span>{col.curator}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Library (main export) ───────────────────────────────────────────────────

export function Library({ onGoToDraftStudio, onAction }: {
  onGoToDraftStudio: () => void;
  onAction: (m: string) => void;
}) {
  const [tab, setTab] = useState<LibTab>("saves");

  const tabs: { id: LibTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: "saves",   label: "My saves",     icon: Folder },
    { id: "matters", label: "Matters",      icon: Briefcase },
    { id: "firm",    label: "Firm library", icon: BookOpen },
  ];

  return (
    <div className="lib-shell">
      <div className="lib-tab-bar">
        {tabs.map(t => (
          <button
            key={t.id}
            className={cn("studio-tab", tab === t.id && "active")}
            onClick={() => setTab(t.id)}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="lib-content">
        {tab === "saves"   && <MySaves onAction={onAction} />}
        {tab === "matters" && <Matters onOpenInStudio={onGoToDraftStudio} onAction={onAction} />}
        {tab === "firm"    && <FirmLibrary onAction={onAction} />}
      </div>
    </div>
  );
}
