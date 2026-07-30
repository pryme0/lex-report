"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus, Folder, Briefcase, BookOpen, ChevronRight,
  ArrowLeft, Trash2, PenLine, Check, Clock, Users,
  Tag, Lock, X, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadExport } from "@/lib/download";
import {
  libraryApi,
  mattersApi,
  firmApi,
  casesApi,
  draftsApi,
  exportsApi,
} from "@/lib/api";
import type {
  SavedCase,
  LibraryFolder,
  Matter,
  FirmCollection,
  CollectionSuggestion,
} from "@/lib/api";
import { useApiQuery, useApiMutation } from "@/lib/api/hooks";
import { AsyncSection, ErrorState } from "@/components/AsyncState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FOLDER_COLORS } from "@/components/SaveToFolderMenu";
import { tcls } from "@/lib/types";

type LibTab = "saves" | "matters" | "firm";
const DRAFT_STORAGE_KEY = "lr-draft-id";

type PendingConfirm = {
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
};

function parseLibTab(value: string | null): LibTab {
  if (value === "matters" || value === "firm" || value === "saves") return value;
  return "saves";
}

// ─── Searchable case picker ───────────────────────────────────────────────────

function CasePicker({
  onSelect,
  onCancel,
  excludeIds = [],
  pending = false,
}: {
  onSelect: (caseId: string) => void;
  onCancel: () => void;
  excludeIds?: string[];
  pending?: boolean;
}) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(timer);
  }, [q]);

  const query = useApiQuery(
    debouncedQ ? `cases:index:${debouncedQ}` : "cases:index",
    () => casesApi.index(debouncedQ || undefined),
  );

  const items = (query.data ?? []).filter((c) => !excludeIds.includes(c.id));

  return (
    <div className="lib-create-panel">
      <div className="lib-create-row">
        <input
          className="form-input"
          style={{ flex: 1 }}
          placeholder="Search cases by title or citation…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
        <button className="btn btn-ghost btn-sm" onClick={onCancel} disabled={pending}>
          Cancel
        </button>
      </div>
      {query.loading && query.data === null && (
        <p style={{ margin: "10px 0 0", fontSize: "0.78rem", color: "var(--color-muted)" }}>
          Loading cases…
        </p>
      )}
      {query.error && (
        <div style={{ marginTop: 10 }}>
          <ErrorState message={query.error} onRetry={query.refetch} />
        </div>
      )}
      {query.data && items.length === 0 && (
        <p style={{ margin: "10px 0 0", fontSize: "0.78rem", color: "var(--color-muted)" }}>
          No matching cases found.
        </p>
      )}
      {items.length > 0 && (
        <div className="save-menu-list" style={{ marginTop: 10, maxHeight: 240 }}>
          {items.map((c) => (
            <button
              key={c.id}
              className="save-menu-item"
              disabled={pending}
              onClick={() => onSelect(c.id)}
            >
              <span className="save-menu-ref">{c.citation}</span>
              {c.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Shared case row ──────────────────────────────────────────────────────────

function CaseRow({
  c,
  onRemove,
  showNote = true,
  onEditNote,
  removePending = false,
}: {
  c: SavedCase;
  onRemove?: () => void;
  showNote?: boolean;
  onEditNote?: (note: string) => boolean | Promise<boolean>;
  removePending?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(c.note ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(c.note ?? "");
  }, [c.note]);

  async function saveNote() {
    if (!onEditNote) return;
    setSaving(true);
    try {
      const ok = await onEditNote(draft);
      if (ok) setEditing(false);
    } finally {
      setSaving(false);
    }
  }

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
              onClick={() => { setOpen((v) => !v); setEditing(false); }}
              title={open ? "Hide note" : "Show note"}
            >
              <PenLine size={13} />
            </button>
          )}
          {onRemove && (
            <button
              className="icon-btn danger"
              onClick={onRemove}
              disabled={removePending}
              title="Remove from collection"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
      {open && (
        <div className="lib-case-note">
          {editing && onEditNote ? (
            <>
              <textarea
                className="form-input"
                style={{ width: "100%", minHeight: 72, resize: "vertical", fontSize: "0.82rem" }}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add a research note…"
              />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button className="btn btn-primary btn-xs" onClick={saveNote} disabled={saving}>
                  <Check size={11} /> Save note
                </button>
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => { setEditing(false); setDraft(c.note ?? ""); }}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : c.note ? (
            <>
              <p>{c.note}</p>
              {onEditNote && (
                <button
                  className="btn btn-ghost btn-xs"
                  style={{ marginTop: 8 }}
                  onClick={() => setEditing(true)}
                >
                  <PenLine size={11} /> Edit note
                </button>
              )}
            </>
          ) : (
            <>
              <span className="lib-case-note-empty">No note added for this case.</span>
              {onEditNote && (
                <button
                  className="btn btn-ghost btn-xs"
                  style={{ marginTop: 8 }}
                  onClick={() => setEditing(true)}
                >
                  <PenLine size={11} /> Add note
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── My Saves tab ─────────────────────────────────────────────────────────────

function MySaves({ onAction }: { onAction: (m: string) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(FOLDER_COLORS[0]);
  const [renameDraft, setRenameDraft] = useState({ name: "", color: FOLDER_COLORS[0] });
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);

  const foldersQuery = useApiQuery("library:folders", () => libraryApi.listFolders());
  const createFolderMut = useApiMutation((body: { name: string; color: string }) =>
    libraryApi.createFolder(body),
  );
  const updateFolderMut = useApiMutation((id: string, body: { name?: string; color?: string }) =>
    libraryApi.updateFolder(id, body),
  );
  const deleteFolderMut = useApiMutation((id: string) => libraryApi.deleteFolder(id));
  const addCaseMut = useApiMutation((folderId: string, caseId: string) =>
    libraryApi.addCase(folderId, { caseId }),
  );
  const removeCaseMut = useApiMutation((folderId: string, caseId: string) =>
    libraryApi.removeCase(folderId, caseId),
  );
  const updateNoteMut = useApiMutation((folderId: string, caseId: string, note: string) =>
    libraryApi.updateNote(folderId, caseId, note),
  );

  const [removingCaseId, setRemovingCaseId] = useState<string | null>(null);

  const folders = foldersQuery.data ?? [];
  const activeFolder = folders.find((f) => f.id === open) ?? null;

  function patchFolders(updated: LibraryFolder) {
    if (!foldersQuery.data) return;
    foldersQuery.setData(foldersQuery.data.map((f) => (f.id === updated.id ? updated : f)));
  }

  async function createFolder() {
    if (!newName.trim()) return;
    const created = await createFolderMut.mutate({ name: newName.trim(), color: newColor });
    if (created) {
      foldersQuery.setData([...(foldersQuery.data ?? []), created]);
      setNewName("");
      setCreating(false);
      onAction(`Folder "${created.name}" created.`);
    }
  }

  function requestDeleteFolder(folder: LibraryFolder) {
    setConfirm({
      title: "Delete folder?",
      body: (
        <>
          <strong>{folder.name}</strong> and all {folder.cases.length} saved case
          {folder.cases.length !== 1 ? "s" : ""} will be removed from your library. This cannot be undone.
        </>
      ),
      confirmLabel: "Delete folder",
      destructive: true,
      onConfirm: async () => {
        setConfirm((c) => (c ? { ...c, busy: true } : c));
        const result = await deleteFolderMut.mutate(folder.id);
        if (result?.deleted) {
          foldersQuery.setData((foldersQuery.data ?? []).filter((f) => f.id !== folder.id));
          if (open === folder.id) setOpen(null);
          onAction("Folder deleted.");
        }
        setConfirm(null);
      },
    });
  }

  function requestRemoveCase(folder: LibraryFolder, caseId: string, title: string) {
    setConfirm({
      title: "Remove case from folder?",
      body: (
        <>
          <strong>{title}</strong> will be removed from {folder.name}. Your research notes in this folder
          will be lost.
        </>
      ),
      confirmLabel: "Remove case",
      destructive: true,
      onConfirm: async () => {
        setConfirm((c) => (c ? { ...c, busy: true } : c));
        setRemovingCaseId(caseId);
        try {
          const updated = await removeCaseMut.mutate(folder.id, caseId);
          if (updated) {
            patchFolders(updated);
            onAction("Case removed from folder.");
          }
        } finally {
          setRemovingCaseId(null);
          setConfirm(null);
        }
      },
    });
  }

  async function saveFolderRename(folderId: string) {
    if (!renameDraft.name.trim()) return;
    const updated = await updateFolderMut.mutate(folderId, {
      name: renameDraft.name.trim(),
      color: renameDraft.color,
    });
    if (updated) {
      patchFolders(updated);
      setRenaming(false);
      onAction("Folder updated.");
    }
  }

  if (activeFolder) {
    return (
      <div className="lib-view">
        <ConfirmDialog
          open={confirm !== null}
          title={confirm?.title ?? ""}
          body={confirm?.body ?? ""}
          confirmLabel={confirm?.confirmLabel}
          destructive={confirm?.destructive}
          busy={confirm?.busy || deleteFolderMut.pending || removeCaseMut.pending}
          onConfirm={() => void confirm?.onConfirm()}
          onCancel={() => setConfirm(null)}
        />
        <div className="lib-view-header">
          <button type="button" className="btn btn-link btn-sm" onClick={() => { setOpen(null); setAdding(false); setRenaming(false); }}>
            <ArrowLeft size={13} /> My saves
          </button>
          <div className="lib-view-title-row">
            <div className="lib-folder-dot" style={{ background: activeFolder.color }} aria-hidden="true" />
            {renaming ? (
              <div className="lib-rename-row">
                <div className="lib-color-picker" role="group" aria-label="Folder colour">
                  {FOLDER_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      className={cn("lib-color-dot", renameDraft.color === col && "selected")}
                      style={{ background: col }}
                      aria-label={`Colour ${col}`}
                      aria-pressed={renameDraft.color === col}
                      onClick={() => setRenameDraft((p) => ({ ...p, color: col }))}
                    />
                  ))}
                </div>
                <input
                  className="form-input"
                  value={renameDraft.name}
                  onChange={(e) => setRenameDraft((p) => ({ ...p, name: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && saveFolderRename(activeFolder.id)}
                  aria-label="Folder name"
                  autoFocus
                />
                <button
                  type="button"
                  className="btn btn-primary btn-xs"
                  onClick={() => saveFolderRename(activeFolder.id)}
                  disabled={!renameDraft.name.trim() || updateFolderMut.pending}
                >
                  <Check size={11} /> Save
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => setRenaming(false)}
                  disabled={updateFolderMut.pending}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <h3 className="lib-view-title">{activeFolder.name}</h3>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => {
                    setRenameDraft({ name: activeFolder.name, color: activeFolder.color });
                    setRenaming(true);
                  }}
                  aria-label={`Rename folder ${activeFolder.name}`}
                >
                  <PenLine size={11} /> Rename
                </button>
              </>
            )}
            <span className="lib-view-count">{activeFolder.cases.length} case{activeFolder.cases.length !== 1 ? "s" : ""}</span>
            <button
              type="button"
              className="btn btn-ghost btn-xs danger-text"
              onClick={() => requestDeleteFolder(activeFolder)}
              disabled={deleteFolderMut.pending}
            >
              <Trash2 size={11} /> Delete folder
            </button>
          </div>
          {updateFolderMut.error && (
            <p role="alert" style={{ fontSize: "0.78rem", color: "var(--color-danger, #9a3244)" }}>
              {updateFolderMut.error}
            </p>
          )}
        </div>

        <div className="matter-cases-header">
          <span className="studio-subsection-title" style={{ margin: 0 }}>
            Saved cases · {activeFolder.cases.length} case{activeFolder.cases.length !== 1 ? "s" : ""}
          </span>
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => setAdding((v) => !v)}
            disabled={addCaseMut.pending}
          >
            <Plus size={11} /> Add case
          </button>
        </div>

        {adding && (
          <CasePicker
            excludeIds={activeFolder.cases.map((c) => c.id)}
            pending={addCaseMut.pending}
            onCancel={() => setAdding(false)}
            onSelect={async (caseId) => {
              const updated = await addCaseMut.mutate(activeFolder.id, caseId);
              if (updated) {
                patchFolders(updated);
                setAdding(false);
                onAction("Case added to folder.");
              }
            }}
          />
        )}
        {addCaseMut.error && (
          <p style={{ margin: "8px 0", fontSize: "0.78rem", color: "var(--color-danger, #9a3244)" }}>
            {addCaseMut.error}
          </p>
        )}

        {activeFolder.cases.length === 0 ? (
          <div className="lib-empty">No cases in this folder yet. Save cases from your research to add them here.</div>
        ) : (
          <div className="lib-case-list">
            {activeFolder.cases.map((c) => (
              <CaseRow
                key={c.id}
                c={c}
                removePending={removingCaseId === c.id}
                onRemove={() => requestRemoveCase(activeFolder, c.id, c.title)}
                onEditNote={async (note) => {
                  const updated = await updateNoteMut.mutate(activeFolder.id, c.id, note);
                  if (updated) {
                    patchFolders(updated);
                    onAction("Note saved.");
                    return true;
                  }
                  return false;
                }}
              />
            ))}
          </div>
        )}
        {removeCaseMut.error && (
          <p style={{ marginTop: 8, fontSize: "0.78rem", color: "var(--color-danger, #9a3244)" }}>
            {removeCaseMut.error}
          </p>
        )}
        {updateNoteMut.error && (
          <p style={{ marginTop: 8, fontSize: "0.78rem", color: "var(--color-danger, #9a3244)" }}>
            {updateNoteMut.error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="lib-view">
      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.title ?? ""}
        body={confirm?.body ?? ""}
        confirmLabel={confirm?.confirmLabel}
        destructive={confirm?.destructive}
        busy={confirm?.busy || deleteFolderMut.pending}
        onConfirm={() => void confirm?.onConfirm()}
        onCancel={() => setConfirm(null)}
      />
      <div className="lib-view-header flat">
        <h3 className="lib-view-title">My saves</h3>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCreating(true)} disabled={createFolderMut.pending}>
          <Plus size={12} /> New folder
        </button>
      </div>

      {creating && (
        <div className="lib-create-panel">
          <div className="lib-create-row">
            <div className="lib-color-picker">
              {FOLDER_COLORS.map((col) => (
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
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createFolder()}
              autoFocus
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={createFolder}
              disabled={!newName.trim() || createFolderMut.pending}
            >
              <Check size={12} /> Create
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setCreating(false)} disabled={createFolderMut.pending}>
              Cancel
            </button>
          </div>
          {createFolderMut.error && (
            <p style={{ margin: "8px 0 0", fontSize: "0.78rem", color: "var(--color-danger, #9a3244)" }}>
              {createFolderMut.error}
            </p>
          )}
        </div>
      )}

      <AsyncSection
        query={foldersQuery}
        loadingLabel="Loading folders…"
        emptyMessage="No folders yet."
        isEmpty={(d) => d.length === 0}
      >
        {(data) => (
          <div className="lib-folder-grid">
            {data.map((f) => (
              <div key={f.id} className="lib-folder-card">
                <button
                  type="button"
                  className="lib-folder-card-open"
                  onClick={() => setOpen(f.id)}
                >
                  <div className="lib-folder-card-top">
                    <div className="lib-folder-icon" style={{ background: f.color + "18", borderColor: f.color + "30" }}>
                      <Folder size={18} style={{ color: f.color }} />
                    </div>
                    <ChevronRight size={14} className="lib-folder-arrow" />
                  </div>
                  <div className="lib-folder-name">{f.name}</div>
                  <div className="lib-folder-meta">
                    <span>{f.cases.length} case{f.cases.length !== 1 ? "s" : ""}</span>
                    <span>Created {f.createdAt}</span>
                  </div>
                </button>
                <button
                  type="button"
                  className="icon-btn danger lib-folder-delete"
                  onClick={() => requestDeleteFolder(f)}
                  disabled={deleteFolderMut.pending}
                  aria-label={`Delete folder ${f.name}`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </AsyncSection>
      {deleteFolderMut.error && (
        <p style={{ marginTop: 8, fontSize: "0.78rem", color: "var(--color-danger, #9a3244)" }}>
          {deleteFolderMut.error}
        </p>
      )}
    </div>
  );
}

// ─── Matters tab ──────────────────────────────────────────────────────────────

function Matters({
  initialCreating = false,
  onGoToDraftStudio,
  onAction,
}: {
  initialCreating?: boolean;
  onGoToDraftStudio: () => void;
  onAction: (m: string) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(initialCreating);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", client: "", ref: "", practiceArea: "" });
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">("all");

  const mattersQuery = useApiQuery(
    open ? null : `matters:${statusFilter}`,
    () => mattersApi.list(statusFilter),
  );
  const matterDetailQuery = useApiQuery(
    open ? `matter:${open}` : null,
    () => mattersApi.detail(open!),
  );
  const createMatterMut = useApiMutation((body: { name: string; client: string; ref?: string; practiceArea?: string }) =>
    mattersApi.create(body),
  );
  const removeMatterMut = useApiMutation((id: string) => mattersApi.remove(id));
  const updateStatusMut = useApiMutation((id: string, status: "active" | "closed") =>
    mattersApi.update(id, { status }),
  );
  const addCaseMut = useApiMutation((matterId: string, caseId: string) =>
    mattersApi.addCase(matterId, { caseId }),
  );
  const removeCaseMut = useApiMutation((matterId: string, caseId: string) =>
    mattersApi.removeCase(matterId, caseId),
  );
  const updateNoteMut = useApiMutation((matterId: string, caseId: string, note: string) =>
    mattersApi.addCase(matterId, { caseId, note }),
  );
  const openDraftMut = useApiMutation((matterId: string) => draftsApi.create({ matterId }));
  const exportBundleMut = useApiMutation((matterId: string) =>
    exportsApi.researchBundle({ matterId }),
  );

  const [removingCaseId, setRemovingCaseId] = useState<string | null>(null);
  const [openingMatterId, setOpeningMatterId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);
  const [pendingDraftMatter, setPendingDraftMatter] = useState<{ id: string; name: string } | null>(null);

  const activeMatter = matterDetailQuery.data ?? null;

  async function openInDraftStudio(matterId: string, matterName: string) {
    setPendingDraftMatter({ id: matterId, name: matterName });
  }

  async function confirmOpenInDraftStudio() {
    if (!pendingDraftMatter) return;
    const { id: matterId, name: matterName } = pendingDraftMatter;
    setOpeningMatterId(matterId);
    try {
      const created = await openDraftMut.mutate(matterId);
      if (created) {
        localStorage.setItem(DRAFT_STORAGE_KEY, created.id);
        onGoToDraftStudio();
        onAction(`Opened ${matterName} in Draft Studio.`);
      }
    } finally {
      setOpeningMatterId(null);
      setPendingDraftMatter(null);
    }
  }

  function requestDeleteMatter(matter: Matter) {
    setConfirm({
      title: "Delete matter?",
      body: (
        <>
          <strong>{matter.name}</strong> ({matter.ref}) and all {matter.cases.length} linked case
          {matter.cases.length !== 1 ? "s" : ""} will be permanently removed.
        </>
      ),
      confirmLabel: "Delete matter",
      destructive: true,
      onConfirm: async () => {
        setConfirm((c) => (c ? { ...c, busy: true } : c));
        const result = await removeMatterMut.mutate(matter.id);
        if (result?.deleted) {
          mattersQuery.setData((mattersQuery.data ?? []).filter((m) => m.id !== matter.id));
          if (open === matter.id) setOpen(null);
          onAction("Matter deleted.");
        }
        setConfirm(null);
      },
    });
  }

  function requestRemoveCaseFromMatter(matter: Matter, caseId: string, title: string) {
    setConfirm({
      title: "Remove case from matter?",
      body: (
        <>
          <strong>{title}</strong> will be removed from {matter.name}. Notes saved to this matter will be lost.
        </>
      ),
      confirmLabel: "Remove case",
      destructive: true,
      onConfirm: async () => {
        setConfirm((c) => (c ? { ...c, busy: true } : c));
        setRemovingCaseId(caseId);
        try {
          const updated = await removeCaseMut.mutate(matter.id, caseId);
          if (updated) {
            patchMatters(updated);
            onAction("Case removed from matter.");
          }
        } finally {
          setRemovingCaseId(null);
          setConfirm(null);
        }
      },
    });
  }

  function patchMatters(updated: Matter) {
    if (matterDetailQuery.data?.id === updated.id) {
      matterDetailQuery.setData(updated);
    }
    if (!mattersQuery.data) return;
    const inList = mattersQuery.data.some((m) => m.id === updated.id);
    if (!inList) return;
    const visible = statusFilter === "all" || updated.status === statusFilter;
    mattersQuery.setData(
      visible
        ? mattersQuery.data.map((m) => (m.id === updated.id ? updated : m))
        : mattersQuery.data.filter((m) => m.id !== updated.id),
    );
  }

  async function createMatter() {
    if (!form.name.trim() || !form.client.trim()) return;
    const created = await createMatterMut.mutate({
      name: form.name.trim(),
      client: form.client.trim(),
      ref: form.ref.trim() || undefined,
      practiceArea: form.practiceArea.trim() || undefined,
    });
    if (created) {
      if (statusFilter === "all" || created.status === statusFilter) {
        mattersQuery.setData([created, ...(mattersQuery.data ?? [])]);
      }
      setForm({ name: "", client: "", ref: "", practiceArea: "" });
      setCreating(false);
      onAction(`Matter "${created.name}" created.`);
    }
  }

  if (open) {
    if (matterDetailQuery.loading && !activeMatter) {
      return (
        <div className="lib-view">
          <div className="lib-view-header">
            <button className="btn btn-link btn-sm" onClick={() => { setOpen(null); setAdding(false); }}>
              <ArrowLeft size={13} /> Matters
            </button>
          </div>
          <AsyncSection query={matterDetailQuery} loadingLabel="Loading matter…">
            {() => null}
          </AsyncSection>
        </div>
      );
    }
    if (matterDetailQuery.error && !activeMatter) {
      return (
        <div className="lib-view">
          <div className="lib-view-header">
            <button className="btn btn-link btn-sm" onClick={() => { setOpen(null); setAdding(false); }}>
              <ArrowLeft size={13} /> Matters
            </button>
          </div>
          <ErrorState message={matterDetailQuery.error} onRetry={matterDetailQuery.refetch} />
        </div>
      );
    }
    if (!activeMatter) return null;

    return (
      <div className="lib-view">
        <ConfirmDialog
          open={confirm !== null}
          title={confirm?.title ?? ""}
          body={confirm?.body ?? ""}
          confirmLabel={confirm?.confirmLabel}
          destructive={confirm?.destructive}
          busy={confirm?.busy || removeMatterMut.pending || removeCaseMut.pending}
          onConfirm={() => void confirm?.onConfirm()}
          onCancel={() => setConfirm(null)}
        />
        <ConfirmDialog
          open={pendingDraftMatter !== null}
          title="Open in Draft Studio?"
          body={
            <>
              Opening <strong>{pendingDraftMatter?.name}</strong> will start a new draft workspace linked
              to this matter. Any unsaved work in your current Draft Studio session may be lost.
            </>
          }
          confirmLabel="Open matter"
          busy={openingMatterId !== null}
          onConfirm={() => void confirmOpenInDraftStudio()}
          onCancel={() => setPendingDraftMatter(null)}
        />
        <div className="lib-view-header">
          <button type="button" className="btn btn-link btn-sm" onClick={() => { setOpen(null); setAdding(false); }}>
            <ArrowLeft size={13} /> Matters
          </button>
          <div className="matter-detail-header">
            <div className="matter-detail-ref">{activeMatter.ref}</div>
            <h3 className="lib-view-title">{activeMatter.name}</h3>
            <div className="matter-detail-meta">
              <span><Users size={11} /> {activeMatter.client}</span>
              <span><Tag size={11} /> {activeMatter.practiceArea}</span>
              <button
                type="button"
                className={cn("matter-status-pill", activeMatter.status)}
                disabled={updateStatusMut.pending}
                title={activeMatter.status === "active" ? "Close matter" : "Reopen matter"}
                onClick={async () => {
                  const next = activeMatter.status === "active" ? "closed" : "active";
                  const updated = await updateStatusMut.mutate(activeMatter.id, next);
                  if (updated) {
                    patchMatters(updated);
                    onAction(next === "closed" ? "Matter closed." : "Matter reopened.");
                  }
                }}
              >
                {activeMatter.status}
              </button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={activeMatter.cases.length === 0 || exportBundleMut.pending}
              onClick={async () => {
                const file = await exportBundleMut.mutate(activeMatter.id);
                if (file) {
                  downloadExport(file);
                  onAction("Research bundle exported.");
                }
              }}
            >
              <Download size={12} /> Export bundle
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm matter-studio-btn"
              disabled={openingMatterId === activeMatter.id}
              onClick={() => openInDraftStudio(activeMatter.id, activeMatter.name)}
            >
              <PenLine size={12} /> Open in Draft Studio
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm danger-text"
              disabled={removeMatterMut.pending}
              onClick={() => requestDeleteMatter(activeMatter)}
            >
              <Trash2 size={12} /> Delete matter
            </button>
          </div>
        </div>

        {removeMatterMut.error && (
          <p role="alert" style={{ margin: "0 0 10px", fontSize: "0.78rem", color: "var(--color-danger, #9a3244)" }}>
            {removeMatterMut.error}
          </p>
        )}

        {exportBundleMut.error && (
          <p style={{ margin: "0 0 10px", fontSize: "0.78rem", color: "var(--color-danger, #9a3244)" }}>
            {exportBundleMut.error}
          </p>
        )}
        {openDraftMut.error && (
          <p style={{ margin: "0 0 10px", fontSize: "0.78rem", color: "var(--color-danger, #9a3244)" }}>
            {openDraftMut.error}
          </p>
        )}

        {updateStatusMut.error && (
          <p style={{ margin: "0 0 10px", fontSize: "0.78rem", color: "var(--color-danger, #9a3244)" }}>
            {updateStatusMut.error}
          </p>
        )}

        <div className="matter-cases-header">
          <span className="studio-subsection-title" style={{ margin: 0 }}>
            Research · {activeMatter.cases.length} case{activeMatter.cases.length !== 1 ? "s" : ""}
          </span>
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => setAdding((v) => !v)}
            disabled={addCaseMut.pending}
          >
            <Plus size={11} /> Add from research
          </button>
        </div>

        {adding && (
          <CasePicker
            excludeIds={activeMatter.cases.map((c) => c.id)}
            pending={addCaseMut.pending}
            onCancel={() => setAdding(false)}
            onSelect={async (caseId) => {
              const updated = await addCaseMut.mutate(activeMatter.id, caseId);
              if (updated) {
                patchMatters(updated);
                setAdding(false);
                onAction("Case added to matter.");
              }
            }}
          />
        )}
        {addCaseMut.error && (
          <p style={{ margin: "8px 0", fontSize: "0.78rem", color: "var(--color-danger, #9a3244)" }}>
            {addCaseMut.error}
          </p>
        )}

        {activeMatter.cases.length === 0 ? (
          <div className="lib-empty">No cases saved to this matter yet. Find cases in Research and save them here.</div>
        ) : (
          <div className="lib-case-list">
            {activeMatter.cases.map((c) => (
              <CaseRow
                key={c.id}
                c={c}
                removePending={removingCaseId === c.id}
                onRemove={() => requestRemoveCaseFromMatter(activeMatter, c.id, c.title)}
                onEditNote={async (note) => {
                  const updated = await updateNoteMut.mutate(activeMatter.id, c.id, note);
                  if (updated) {
                    patchMatters(updated);
                    onAction("Note saved.");
                    return true;
                  }
                  return false;
                }}
              />
            ))}
          </div>
        )}
        {removeCaseMut.error && (
          <p style={{ marginTop: 8, fontSize: "0.78rem", color: "var(--color-danger, #9a3244)" }}>
            {removeCaseMut.error}
          </p>
        )}
        {updateNoteMut.error && (
          <p style={{ marginTop: 8, fontSize: "0.78rem", color: "var(--color-danger, #9a3244)" }}>
            {updateNoteMut.error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="lib-view">
      <ConfirmDialog
        open={pendingDraftMatter !== null}
        title="Open in Draft Studio?"
        body={
          <>
            Opening <strong>{pendingDraftMatter?.name}</strong> will start a new draft workspace linked
            to this matter. Any unsaved work in your current Draft Studio session may be lost.
          </>
        }
        confirmLabel="Open matter"
        busy={openingMatterId !== null}
        onConfirm={() => void confirmOpenInDraftStudio()}
        onCancel={() => setPendingDraftMatter(null)}
      />
      <div className="lib-view-header flat">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h3 className="lib-view-title">Matters</h3>
          <div className="lib-filter-strip">
            {(["all", "active", "closed"] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={cn("lib-filter-btn", statusFilter === s && "active")}
                aria-current={statusFilter === s ? "true" : undefined}
                onClick={() => setStatusFilter(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setCreating(true)} disabled={createMatterMut.pending}>
          <Plus size={12} /> New matter
        </button>
      </div>

      {creating && (
        <div className="lib-create-panel">
          <div className="matter-create-form">
            <div className="matter-form-row">
              <div className="form-field" style={{ flex: 2 }}>
                <label className="form-label">Matter name *</label>
                <input className="form-input" placeholder="e.g. Okonkwo v. Meridian Energy" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label">Matter reference</label>
                <input className="form-input" placeholder="MC/2026/0000" value={form.ref} onChange={(e) => setForm((p) => ({ ...p, ref: e.target.value }))} />
              </div>
            </div>
            <div className="matter-form-row">
              <div className="form-field" style={{ flex: 2 }}>
                <label className="form-label">Client *</label>
                <input className="form-input" placeholder="Client name" value={form.client} onChange={(e) => setForm((p) => ({ ...p, client: e.target.value }))} />
              </div>
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label">Practice area</label>
                <input className="form-input" placeholder="e.g. Banking & Finance" value={form.practiceArea} onChange={(e) => setForm((p) => ({ ...p, practiceArea: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setCreating(false)} disabled={createMatterMut.pending}>Cancel</button>
              <button
                className="btn btn-primary btn-sm"
                onClick={createMatter}
                disabled={!form.name.trim() || !form.client.trim() || createMatterMut.pending}
              >
                <Check size={12} /> Create matter
              </button>
            </div>
            {createMatterMut.error && (
              <p style={{ margin: "8px 0 0", fontSize: "0.78rem", color: "var(--color-danger, #9a3244)" }}>
                {createMatterMut.error}
              </p>
            )}
          </div>
        </div>
      )}

      <AsyncSection
        query={mattersQuery}
        loadingLabel="Loading matters…"
        emptyMessage="No matters match this filter."
        isEmpty={(d) => d.length === 0}
      >
        {(filtered) => (
          <div className="matters-list">
            {filtered.map((m) => (
              <div key={m.id} className={cn("matter-card", m.status === "closed" && "closed")}>
                <button type="button" className="matter-card-open" onClick={() => setOpen(m.id)}>
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
                  </div>
                </button>
                <button
                  type="button"
                  className="matter-studio-link"
                  disabled={openingMatterId === m.id}
                  onClick={() => openInDraftStudio(m.id, m.name)}
                >
                  <PenLine size={12} /> Open in Draft Studio
                </button>
              </div>
            ))}
          </div>
        )}
      </AsyncSection>
      {openDraftMut.error && (
        <p style={{ marginTop: 8, fontSize: "0.78rem", color: "var(--color-danger, #9a3244)" }}>
          {openDraftMut.error}
        </p>
      )}
    </div>
  );
}

// ─── Firm Library tab ─────────────────────────────────────────────────────────

function SuggestionRow({
  s,
  onApprove,
  onReject,
  pending,
}: {
  s: CollectionSuggestion;
  onApprove: () => void;
  onReject: () => void;
  pending: boolean;
}) {
  return (
    <div className="lib-case-row">
      <div className="lib-case-row-main">
        <div className="lib-case-row-info">
          <span className={cn("treatment-pill", tcls[s.case.treatment])}>{s.case.treatment}</span>
          <div className="lib-case-row-title">{s.case.title}</div>
          <div className="lib-case-row-cite">{s.case.citation}</div>
          {s.note && <div style={{ fontSize: "0.78rem", color: "var(--color-muted)", marginTop: 4 }}>{s.note}</div>}
          <div style={{ fontSize: "0.72rem", color: "var(--color-faint)", marginTop: 4 }}>
            Suggested by {s.suggestedBy}
          </div>
        </div>
        <div className="lib-case-row-actions">
          <button className="btn btn-primary btn-xs" onClick={onApprove} disabled={pending}>
            <Check size={11} /> Approve
          </button>
          <button className="btn btn-ghost btn-xs" onClick={onReject} disabled={pending}>
            <X size={11} /> Reject
          </button>
        </div>
      </div>
    </div>
  );
}

function FirmLibrary({ onAction }: { onAction: (m: string) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [areaFilter, setAreaFilter] = useState("All");
  const [reviewing, setReviewing] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [colForm, setColForm] = useState({ name: "", practiceArea: "", description: "" });
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);
  const [removingCaseId, setRemovingCaseId] = useState<string | null>(null);

  const allAreasQuery = useApiQuery("firm:areas", () => firmApi.listCollections());
  const collectionsQuery = useApiQuery(
    open ? null : `firm:list:${areaFilter}`,
    () => firmApi.listCollections(areaFilter === "All" ? undefined : areaFilter),
  );
  const collectionDetailQuery = useApiQuery(
    open ? `firm:collection:${open}` : null,
    () => firmApi.collection(open!),
  );
  const suggestionsQuery = useApiQuery(
    open && (reviewing || suggesting) ? `firm:${open}:suggestions:pending` : null,
    () => firmApi.listSuggestions(open!, "pending"),
  );

  const suggestMut = useApiMutation((colId: string, caseId: string) =>
    firmApi.suggest(colId, { caseId }),
  );
  const approveMut = useApiMutation((colId: string, suggestionId: string) =>
    firmApi.approve(colId, suggestionId),
  );
  const rejectMut = useApiMutation((colId: string, suggestionId: string) =>
    firmApi.reject(colId, suggestionId),
  );
  const createColMut = useApiMutation((body: { name: string; practiceArea?: string; description?: string }) =>
    firmApi.createCollection(body),
  );
  const deleteColMut = useApiMutation((id: string) => firmApi.deleteCollection(id));
  const removeCaseMut = useApiMutation((colId: string, caseId: string) =>
    firmApi.removeCase(colId, caseId),
  );

  const activeCol = collectionDetailQuery.data ?? null;

  const areas = ["All", ...Array.from(new Set((allAreasQuery.data ?? []).map((c) => c.practiceArea)))];

  function patchCollection(updated: FirmCollection) {
    if (collectionDetailQuery.data?.id === updated.id) {
      collectionDetailQuery.setData(updated);
    }
    if (collectionsQuery.data) {
      collectionsQuery.setData(collectionsQuery.data.map((c) => (c.id === updated.id ? updated : c)));
    }
    if (allAreasQuery.data) {
      allAreasQuery.setData(allAreasQuery.data.map((c) => (c.id === updated.id ? updated : c)));
    }
  }

  function bumpSuggestedCount(colId: string, delta: number) {
    const patch = (col: FirmCollection) =>
      col.id === colId ? { ...col, suggestedCount: Math.max(0, col.suggestedCount + delta) } : col;
    if (collectionDetailQuery.data?.id === colId) {
      collectionDetailQuery.setData(patch(collectionDetailQuery.data));
    }
    if (collectionsQuery.data) {
      collectionsQuery.setData(collectionsQuery.data.map(patch));
    }
    if (allAreasQuery.data) {
      allAreasQuery.setData(allAreasQuery.data.map(patch));
    }
  }

  async function createCollection() {
    if (!colForm.name.trim()) return;
    const created = await createColMut.mutate({
      name: colForm.name.trim(),
      practiceArea: colForm.practiceArea.trim() || undefined,
      description: colForm.description.trim() || undefined,
    });
    if (created) {
      if (allAreasQuery.data) allAreasQuery.setData([created, ...allAreasQuery.data]);
      if (areaFilter === "All" || created.practiceArea === areaFilter) {
        collectionsQuery.setData([created, ...(collectionsQuery.data ?? [])]);
      }
      setColForm({ name: "", practiceArea: "", description: "" });
      setCreating(false);
      onAction(`Collection "${created.name}" created.`);
    }
  }

  function requestDeleteCollection(col: FirmCollection) {
    setConfirm({
      title: "Delete collection?",
      body: (
        <>
          <strong>{col.name}</strong> and its {col.cases.length} curated case
          {col.cases.length !== 1 ? "s" : ""} will be removed from the firm library.
        </>
      ),
      confirmLabel: "Delete collection",
      destructive: true,
      onConfirm: async () => {
        setConfirm((c) => (c ? { ...c, busy: true } : c));
        const result = await deleteColMut.mutate(col.id);
        if (result?.deleted) {
          if (allAreasQuery.data) {
            allAreasQuery.setData(allAreasQuery.data.filter((c) => c.id !== col.id));
          }
          if (collectionsQuery.data) {
            collectionsQuery.setData(collectionsQuery.data.filter((c) => c.id !== col.id));
          }
          if (open === col.id) setOpen(null);
          onAction("Collection deleted.");
        }
        setConfirm(null);
      },
    });
  }

  function requestRemoveFromCollection(col: FirmCollection, caseId: string, title: string) {
    setConfirm({
      title: "Remove case from collection?",
      body: (
        <>
          <strong>{title}</strong> will be removed from {col.name}. Partners can re-add it later if needed.
        </>
      ),
      confirmLabel: "Remove case",
      destructive: true,
      onConfirm: async () => {
        setConfirm((c) => (c ? { ...c, busy: true } : c));
        setRemovingCaseId(caseId);
        try {
          const updated = await removeCaseMut.mutate(col.id, caseId);
          if (updated) {
            patchCollection(updated);
            onAction("Case removed from collection.");
          }
        } finally {
          setRemovingCaseId(null);
          setConfirm(null);
        }
      },
    });
  }

  if (open) {
    if (collectionDetailQuery.loading && !activeCol) {
      return (
        <div className="lib-view">
          <div className="lib-view-header">
            <button className="btn btn-link btn-sm" onClick={() => { setOpen(null); setReviewing(false); setSuggesting(false); }}>
              <ArrowLeft size={13} /> Firm library
            </button>
          </div>
          <AsyncSection query={collectionDetailQuery} loadingLabel="Loading collection…">
            {() => null}
          </AsyncSection>
        </div>
      );
    }
    if (collectionDetailQuery.error && !activeCol) {
      return (
        <div className="lib-view">
          <div className="lib-view-header">
            <button className="btn btn-link btn-sm" onClick={() => { setOpen(null); setReviewing(false); setSuggesting(false); }}>
              <ArrowLeft size={13} /> Firm library
            </button>
          </div>
          <ErrorState message={collectionDetailQuery.error} onRetry={collectionDetailQuery.refetch} />
        </div>
      );
    }
    if (!activeCol) return null;

    return (
      <div className="lib-view">
        <ConfirmDialog
          open={confirm !== null}
          title={confirm?.title ?? ""}
          body={confirm?.body ?? ""}
          confirmLabel={confirm?.confirmLabel}
          destructive={confirm?.destructive}
          busy={confirm?.busy || deleteColMut.pending || removeCaseMut.pending}
          onConfirm={() => void confirm?.onConfirm()}
          onCancel={() => setConfirm(null)}
        />
        <div className="lib-view-header">
          <button type="button" className="btn btn-link btn-sm" onClick={() => { setOpen(null); setReviewing(false); setSuggesting(false); }}>
            <ArrowLeft size={13} /> Firm library
          </button>
          <div className="firm-col-header">
            <div className="firm-col-area">{activeCol.practiceArea}</div>
            <h3 className="lib-view-title">
              {activeCol.name}
              {activeCol.locked && <Lock size={14} style={{ marginLeft: 8, color: "var(--color-faint)", display: "inline", verticalAlign: "middle" }} aria-hidden="true" />}
            </h3>
            <div className="firm-col-meta">
              <span>Curated by {activeCol.curator} · {activeCol.curatorRole}</span>
            </div>
            <p className="firm-col-desc">{activeCol.description}</p>
          </div>
          {!activeCol.locked && (
            <button
              type="button"
              className="btn btn-ghost btn-sm danger-text"
              disabled={deleteColMut.pending}
              onClick={() => requestDeleteCollection(activeCol)}
            >
              <Trash2 size={12} /> Delete collection
            </button>
          )}
          {activeCol.suggestedCount > 0 && (
            <div className="firm-suggested-banner">
              <span>{activeCol.suggestedCount} case{activeCol.suggestedCount !== 1 ? "s" : ""} suggested by associates — awaiting approval</span>
              <button
                className="btn btn-primary btn-xs"
                onClick={() => setReviewing((v) => !v)}
                disabled={approveMut.pending || rejectMut.pending}
              >
                <Check size={11} /> Review suggestions
              </button>
            </div>
          )}
        </div>

        {reviewing && (
          <div style={{ marginBottom: 14 }}>
            <AsyncSection
              query={suggestionsQuery}
              loadingLabel="Loading suggestions…"
              emptyMessage="No pending suggestions."
              isEmpty={(d) => d.length === 0}
            >
              {(suggestions) => (
                <div className="lib-case-list">
                  {suggestions.map((s) => (
                    <SuggestionRow
                      key={s.id}
                      s={s}
                      pending={approveMut.pending || rejectMut.pending}
                      onApprove={async () => {
                        const updated = await approveMut.mutate(activeCol.id, s.id);
                        if (updated) {
                          patchCollection(updated);
                          if (suggestionsQuery.data) {
                            suggestionsQuery.setData(suggestionsQuery.data.filter((x) => x.id !== s.id));
                          }
                          onAction("Suggested case approved and added to collection.");
                        }
                      }}
                      onReject={async () => {
                        const result = await rejectMut.mutate(activeCol.id, s.id);
                        if (result) {
                          bumpSuggestedCount(activeCol.id, -1);
                          if (suggestionsQuery.data) {
                            suggestionsQuery.setData(suggestionsQuery.data.filter((x) => x.id !== s.id));
                          }
                          onAction("Suggestion rejected.");
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </AsyncSection>
            {(approveMut.error || rejectMut.error) && (
              <p style={{ marginTop: 8, fontSize: "0.78rem", color: "var(--color-danger, #9a3244)" }}>
                {approveMut.error ?? rejectMut.error}
              </p>
            )}
          </div>
        )}

        {activeCol.cases.length === 0 ? (
          <div className="lib-empty">No cases in this collection yet.</div>
        ) : (
          <div className="lib-case-list">
            {activeCol.cases.map((c) => (
              <CaseRow
                key={c.id}
                c={c}
                showNote={false}
                removePending={removingCaseId === c.id}
                onRemove={
                  !activeCol.locked
                    ? () => requestRemoveFromCollection(activeCol, c.id, c.title)
                    : undefined
                }
              />
            ))}
          </div>
        )}
        {!activeCol.locked && (
          <div style={{ marginTop: 14 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSuggesting((v) => !v)}
              disabled={suggestMut.pending}
            >
              <Plus size={12} /> Suggest a case
            </button>
          </div>
        )}
        {suggesting && !activeCol.locked && (
          <CasePicker
            excludeIds={[
              ...activeCol.cases.map((c) => c.id),
              ...(suggestionsQuery.data ?? []).map((s) => s.caseId),
            ]}
            pending={suggestMut.pending}
            onCancel={() => setSuggesting(false)}
            onSelect={async (caseId) => {
              const result = await suggestMut.mutate(activeCol.id, caseId);
              if (result) {
                bumpSuggestedCount(activeCol.id, 1);
                setSuggesting(false);
                onAction("Case suggestion submitted for partner approval.");
              }
            }}
          />
        )}
        {suggestMut.error && (
          <p style={{ marginTop: 8, fontSize: "0.78rem", color: "var(--color-danger, #9a3244)" }}>
            {suggestMut.error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="lib-view">
      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.title ?? ""}
        body={confirm?.body ?? ""}
        confirmLabel={confirm?.confirmLabel}
        destructive={confirm?.destructive}
        busy={confirm?.busy || deleteColMut.pending}
        onConfirm={() => void confirm?.onConfirm()}
        onCancel={() => setConfirm(null)}
      />
      <div className="lib-view-header flat">
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h3 className="lib-view-title">Firm library</h3>
          <div className="lib-filter-strip" role="tablist" aria-label="Practice area filter">
            {areas.map((a) => (
              <button
                key={a}
                type="button"
                className={cn("lib-filter-btn", areaFilter === a && "active")}
                aria-current={areaFilter === a ? "true" : undefined}
                onClick={() => setAreaFilter(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setCreating(true)}
          disabled={createColMut.pending}
        >
          <Plus size={12} /> New collection
        </button>
      </div>

      {creating && (
        <div className="lib-create-panel">
          <div className="matter-create-form">
            <div className="matter-form-row">
              <div className="form-field" style={{ flex: 2 }}>
                <label className="form-label" htmlFor="firm-col-name">Collection name *</label>
                <input
                  id="firm-col-name"
                  className="form-input"
                  placeholder="e.g. Secured Credit Desk Authorities"
                  value={colForm.name}
                  onChange={(e) => setColForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="form-field" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="firm-col-area">Practice area</label>
                <input
                  id="firm-col-area"
                  className="form-input"
                  placeholder="e.g. Banking & Finance"
                  value={colForm.practiceArea}
                  onChange={(e) => setColForm((p) => ({ ...p, practiceArea: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="firm-col-desc">Description</label>
              <textarea
                id="firm-col-desc"
                className="form-input"
                style={{ width: "100%", minHeight: 72, resize: "vertical" }}
                placeholder="What this collection is for…"
                value={colForm.description}
                onChange={(e) => setColForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCreating(false)} disabled={createColMut.pending}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={createCollection}
                disabled={!colForm.name.trim() || createColMut.pending}
              >
                <Check size={12} /> Create collection
              </button>
            </div>
            {createColMut.error && (
              <p role="alert" style={{ margin: "8px 0 0", fontSize: "0.78rem", color: "var(--color-danger, #9a3244)" }}>
                {createColMut.error}
              </p>
            )}
          </div>
        </div>
      )}

      <AsyncSection
        query={collectionsQuery}
        loadingLabel="Loading collections…"
        emptyMessage="No collections match this filter."
        isEmpty={(d) => d.length === 0}
      >
        {(filtered) => (
          <div className="firm-grid">
            {filtered.map((col) => (
              <button
                key={col.id}
                type="button"
                className="firm-card"
                onClick={() => setOpen(col.id)}
              >
                <div className="firm-card-top">
                  <div className="firm-card-area">{col.practiceArea}</div>
                  {col.locked && <Lock size={12} style={{ color: "var(--color-faint)" }} aria-label="Locked collection" />}
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
              </button>
            ))}
          </div>
        )}
      </AsyncSection>
      {deleteColMut.error && (
        <p role="alert" style={{ marginTop: 8, fontSize: "0.78rem", color: "var(--color-danger, #9a3244)" }}>
          {deleteColMut.error}
        </p>
      )}
    </div>
  );
}

// ─── Library (main export) ───────────────────────────────────────────────────

function LibraryContent({ onGoToDraftStudio, onAction }: {
  onGoToDraftStudio: () => void;
  onAction: (m: string) => void;
}) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<LibTab>(() => parseLibTab(searchParams.get("tab")));
  const initialCreating = searchParams.get("tab") === "matters" && searchParams.get("new") === "1";

  const tabs: { id: LibTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: "saves",   label: "My saves",     icon: Folder },
    { id: "matters", label: "Matters",      icon: Briefcase },
    { id: "firm",    label: "Firm library", icon: BookOpen },
  ];

  return (
    <div className="lib-shell">
      <div className="lib-tab-bar">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={cn("studio-tab", tab === t.id && "active")}
            aria-current={tab === t.id ? "page" : undefined}
            onClick={() => setTab(t.id)}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="lib-content">
        {tab === "saves"   && <MySaves onAction={onAction} />}
        {tab === "matters" && (
          <Matters
            initialCreating={initialCreating}
            onGoToDraftStudio={onGoToDraftStudio}
            onAction={onAction}
          />
        )}
        {tab === "firm"    && <FirmLibrary onAction={onAction} />}
      </div>
    </div>
  );
}

export function Library({ onGoToDraftStudio, onAction }: {
  onGoToDraftStudio: () => void;
  onAction: (m: string) => void;
}) {
  return (
    <Suspense fallback={null}>
      <LibraryContent onGoToDraftStudio={onGoToDraftStudio} onAction={onAction} />
    </Suspense>
  );
}
