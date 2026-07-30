"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { libraryApi } from "@/lib/api";
import type { LibraryFolder } from "@/lib/api";
import { useApiQuery, useApiMutation } from "@/lib/api/hooks";

export const FOLDER_COLORS = ["#2d7c54", "#1c5c9e", "#8a5e0e", "#9a3244", "#4a4a7c", "#6b7068"];

export function SaveToFolderMenu({
  caseId,
  onSaved,
}: {
  caseId: string;
  onSaved: (folder: LibraryFolder) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(FOLDER_COLORS[0]);

  const foldersQuery = useApiQuery("library:folders", () => libraryApi.listFolders());
  const addCaseMut = useApiMutation((folderId: string) =>
    libraryApi.addCase(folderId, { caseId }),
  );
  const createFolderMut = useApiMutation((body: { name: string; color: string }) =>
    libraryApi.createFolder(body),
  );

  const folders = (foldersQuery.data ?? []).filter(
    (f) => !f.cases.some((c) => c.id === caseId),
  );

  async function saveToFolder(folderId: string) {
    const updated = await addCaseMut.mutate(folderId);
    if (updated) {
      foldersQuery.setData(
        (foldersQuery.data ?? []).map((f) => (f.id === updated.id ? updated : f)),
      );
      onSaved(updated);
    }
  }

  async function createAndSave() {
    if (!newName.trim()) return;
    const created = await createFolderMut.mutate({ name: newName.trim(), color: newColor });
    if (!created) return;
    foldersQuery.setData([...(foldersQuery.data ?? []), created]);
    setCreating(false);
    setNewName("");
    await saveToFolder(created.id);
  }

  if (foldersQuery.loading && foldersQuery.data === null) {
    return <p className="save-menu-note">Loading folders…</p>;
  }
  if (foldersQuery.error) {
    return <p className="save-menu-note" role="alert">{foldersQuery.error}</p>;
  }

  return (
    <div className="save-to-folder-menu">
      {!creating ? (
        <>
          {folders.length === 0 ? (
            <p className="save-menu-note">No folders yet — create one below.</p>
          ) : (
            <div className="save-menu-list">
              {folders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className="save-menu-item"
                  disabled={addCaseMut.pending || createFolderMut.pending}
                  onClick={() => saveToFolder(f.id)}
                >
                  <span className="save-menu-ref" style={{ color: f.color }}>{f.name}</span>
                  {f.cases.length} case{f.cases.length !== 1 ? "s" : ""}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-xs save-to-folder-create"
            onClick={() => setCreating(true)}
            disabled={addCaseMut.pending || createFolderMut.pending}
          >
            <Plus size={11} /> New folder
          </button>
        </>
      ) : (
        <div className="save-to-folder-inline">
          <div className="lib-color-picker" role="group" aria-label="Folder colour">
            {FOLDER_COLORS.map((col) => (
              <button
                key={col}
                type="button"
                className={cn("lib-color-dot", newColor === col && "selected")}
                style={{ background: col }}
                aria-label={`Colour ${col}`}
                aria-pressed={newColor === col}
                onClick={() => setNewColor(col)}
              />
            ))}
          </div>
          <input
            className="form-input"
            placeholder="Folder name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createAndSave()}
            autoFocus
            aria-label="New folder name"
          />
          <div className="save-to-folder-inline-actions">
            <button
              type="button"
              className="btn btn-primary btn-xs"
              onClick={createAndSave}
              disabled={!newName.trim() || createFolderMut.pending || addCaseMut.pending}
            >
              <Check size={11} /> Create &amp; save
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => { setCreating(false); setNewName(""); }}
              disabled={createFolderMut.pending || addCaseMut.pending}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {(addCaseMut.error || createFolderMut.error) && (
        <p className="save-menu-note" role="alert" style={{ color: "var(--color-danger, #9a3244)" }}>
          {addCaseMut.error ?? createFolderMut.error}
        </p>
      )}
    </div>
  );
}
