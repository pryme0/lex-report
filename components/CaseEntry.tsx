"use client";

import { useRef, useState } from "react";
import { Clock, TrendingUp, ArrowRight, Share2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/contexts/DashboardContext";
import { mattersApi } from "@/lib/api";
import type { CaseSummary, Matter } from "@/lib/api";
import { useApiQuery, useApiMutation } from "@/lib/api/hooks";
import { useDismissable } from "@/lib/useDismissable";
import { SaveToFolderMenu } from "@/components/SaveToFolderMenu";
import { renderSearchSnippet } from "@/lib/search/snippet";
import { tcls } from "@/lib/types";

type SaveTarget = "matter" | "folder";

function SaveToMatter({ item, onSaved }: { item: CaseSummary; onSaved: (m: Matter) => void }) {
  const matters = useApiQuery("matters:active", () => mattersApi.list("active"));
  const save = useApiMutation((matterId: string) =>
    mattersApi.addCase(matterId, { caseId: item.id }),
  );

  if (matters.loading) return <div className="save-menu-note">Loading matters…</div>;
  if (matters.error) return <div className="save-menu-note">{matters.error}</div>;
  if (!matters.data?.length) {
    return <div className="save-menu-note">No open matters. Create one in the Library.</div>;
  }

  return (
    <div className="save-menu-list">
      {matters.data.map((m) => (
        <button
          key={m.id}
          className="save-menu-item"
          disabled={save.pending}
          onClick={async () => {
            const updated = await save.mutate(m.id);
            if (updated) onSaved(updated);
          }}
        >
          <span className="save-menu-ref">{m.ref}</span>
          {m.name}
        </button>
      ))}
      {save.error && <div className="save-menu-note">{save.error}</div>}
    </div>
  );
}

export function CaseEntry({ item }: { item: CaseSummary }) {
  const { openCase, viewGraph, showToast } = useDashboard();
  const [saveTarget, setSaveTarget] = useState<SaveTarget | null>(null);
  const matterTriggerRef = useRef<HTMLButtonElement>(null);
  const folderTriggerRef = useRef<HTMLButtonElement>(null);
  const saveMenuRef = useDismissable<HTMLDivElement>(
    saveTarget !== null,
    () => setSaveTarget(null),
    saveTarget === "matter" ? matterTriggerRef : folderTriggerRef,
  );
  const t = tcls[item.treatment];

  return (
    <div className={cn("case-entry", t)}>
      <div className="case-entry-head">
        <span className="case-court-year">
          {item.court} · {item.year}
        </span>
        <span className={cn("treatment-pill", t)}>{item.treatment}</span>
      </div>
      <button className="case-title-btn" onClick={() => openCase(item.id)}>
        <h3>{item.title}</h3>
      </button>
      <div className="case-citation">{item.citation}</div>
      {item.snippet ? (
        <p className="case-snippet">{renderSearchSnippet(item.snippet)}</p>
      ) : (
        <p className="case-ratio">{item.ratio}</p>
      )}
      <div className="case-meta">
        <span className="case-tag">{item.area}</span>
        <span className="case-tag">{item.posture}</span>
        <span className="case-tag">
          <Clock size={10} /> {item.readTime}
        </span>
        <span className="case-tag">
          <TrendingUp size={10} /> {item.strength}%
        </span>
        {item.verified && (
          <span className="case-tag verified">
            <Check size={10} /> Verified
          </span>
        )}
      </div>
      <div className="case-actions">
        <button className="btn btn-primary btn-sm" onClick={() => openCase(item.id)}>
          Open judgment <ArrowRight size={12} />
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => viewGraph(item.id)}>
          <Share2 size={12} /> Citation graph
        </button>
        <div className="save-menu-wrap" ref={saveMenuRef}>
          <button
            ref={matterTriggerRef}
            className="btn btn-ghost btn-sm"
            aria-expanded={saveTarget === "matter"}
            onClick={() => setSaveTarget((s) => (s === "matter" ? null : "matter"))}
          >
            Save to matter
          </button>
          <button
            ref={folderTriggerRef}
            className="btn btn-ghost btn-sm"
            aria-expanded={saveTarget === "folder"}
            onClick={() => setSaveTarget((s) => (s === "folder" ? null : "folder"))}
          >
            Save to folder
          </button>
          {saveTarget === "matter" && (
            <div className="save-menu">
              <SaveToMatter
                item={item}
                onSaved={(m) => {
                  setSaveTarget(null);
                  showToast(`${item.citation} saved to ${m.ref}.`);
                }}
              />
            </div>
          )}
          {saveTarget === "folder" && (
            <div className="save-menu">
              <SaveToFolderMenu
                caseId={item.id}
                onSaved={(f) => {
                  setSaveTarget(null);
                  showToast(`${item.citation} saved to ${f.name}.`);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
