"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus, ChevronDown, ChevronRight, Trash2,
  ArrowUp, ArrowDown, FileText, Download, List, Search,
} from "lucide-react";
import { AutoSizeInput, AutoSizeTextarea } from "@/components/AutoSizeInput";
import { cn } from "@/lib/utils";
import { casesApi, draftsApi, mattersApi, ApiError } from "@/lib/api";
import type {
  Brief,
  BundleDetails,
  CaseIndexItem,
  CaseSummary,
  DraftIssue,
  DraftWorkspace,
  Matter,
  SavedCase,
} from "@/lib/api";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { LoadingState, ErrorState } from "@/components/AsyncState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { downloadExport } from "@/lib/download";
import { useDismissable } from "@/lib/useDismissable";
import { tcls } from "@/lib/types";

const DRAFT_STORAGE_KEY = "lr-draft-id";

function formatDraftDate(iso: string): string {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return iso;
  return new Date(parsed).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const EMPTY_BUNDLE_DETAILS: BundleDetails = {
  court: "",
  location: "",
  suitNo: "",
  appellant: "",
  respondent: "",
};

const EMPTY_BRIEF: Brief = {
  ...EMPTY_BUNDLE_DETAILS,
  intro: "",
  conclusion: "",
  relief: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

type IssueEdit = { text: string; submission: string };

function draftHasContent(
  draft: DraftWorkspace,
  issueEdits: Record<string, IssueEdit>,
  noteDrafts: Record<string, string>,
  bundleDetailsDraft: BundleDetails | null,
  briefDraft: Brief | null,
): boolean {
  if (draft.issues.length > 0) return true;
  if (draft.bundleOrder.length > 0) return true;

  const bundle = bundleDetailsDraft ?? draft.bundleDetails;
  if (Object.values(bundle).some((v) => v.trim())) return true;

  const brief = briefDraft ?? draft.brief;
  if (Object.values(brief).some((v) => v.trim())) return true;

  if (Object.values(draft.notes).some((n) => n.trim())) return true;
  if (Object.values(noteDrafts).some((n) => n.trim())) return true;

  return Object.values(issueEdits).some((e) => e.text.trim() || e.submission.trim());
}

type PendingConfirm = {
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
};

type ResolvedCase =
  | SavedCase
  | (CaseIndexItem & { unresolved?: false })
  | { id: string; title: string; citation: string; unresolved: true };

function resolveCase(
  id: string,
  cases: SavedCase[],
  index: CaseIndexItem[],
): ResolvedCase {
  const saved = cases.find((c) => c.id === id);
  if (saved) return saved;
  const indexed = index.find((c) => c.id === id);
  if (indexed) return indexed;
  return { id, title: id, citation: "Authority unresolved", unresolved: true };
}

function isSavedCase(c: ResolvedCase): c is SavedCase {
  return "treatment" in c && !("unresolved" in c);
}

// ─── Cases sidebar ────────────────────────────────────────────────────────────

function CasesSidebar({
  cases,
  onAddToIssue,
  onAddToBundle,
  bundleOrder,
  activeIssueId,
  matterLinked,
  pending,
}: {
  cases: SavedCase[];
  onAddToIssue: (caseId: string) => void;
  onAddToBundle: (caseId: string) => void;
  bundleOrder: string[];
  activeIssueId: string | null;
  matterLinked: boolean;
  pending?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CaseSummary[] | null>(null);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!q.trim()) {
      setSearchResults(null);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const result = await casesApi.search({ q, limit: 10 });
        setSearchResults(result.data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  const displayCases = searchResults ?? cases;
  const isSearching = searchQuery.trim().length > 0;

  return (
    <aside className="studio-sidebar">
      <div className="studio-search-box">
        <Search size={14} className="studio-search-icon" />
        <input
          type="text"
          className="studio-search-input"
          placeholder="Search cases..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {searching && <span className="studio-search-spinner" />}
      </div>

      <div className="studio-sidebar-label">
        {isSearching ? `Results · ${displayCases.length}` : `Saved cases · ${cases.length}`}
      </div>

      <div className="studio-case-list">
        {displayCases.length === 0 ? (
          <div className="studio-sidebar-empty">
            {isSearching
              ? "No cases found. Try a different search."
              : matterLinked
              ? "No saved authorities yet."
              : "Link a matter to load saved authorities, or search above."}
          </div>
        ) : (
          displayCases.map((c) => {
            const caseId = c.id;
            const title = c.title;
            const inBundle = bundleOrder.includes(caseId);
            return (
              <div className="studio-case-item" key={caseId}>
                <div className="studio-case-info">
                  <div className="studio-case-name">{title}</div>
                  <div className="studio-case-cite">{c.citation}</div>
                  <div className="studio-case-meta">
                    {"treatment" in c && (
                      <span className={cn("treatment-pill", tcls[c.treatment])}>{c.treatment}</span>
                    )}
                    {!inBundle && (
                      <button
                        className="btn btn-xs studio-add-auth"
                        onClick={() => onAddToBundle(caseId)}
                        title="Add to bundle"
                        disabled={pending}
                      >
                        + Bundle
                      </button>
                    )}
                    {activeIssueId && (
                      <button
                        className="btn btn-xs studio-add-auth"
                        onClick={() => onAddToIssue(caseId)}
                        title="Add to active issue"
                        disabled={pending}
                      >
                        + Issue
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

// ─── Arguments tab ────────────────────────────────────────────────────────────

function ArgumentsTab({
  issues,
  issueEdits,
  onIssueEdit,
  onSaveIssue,
  onAddIssue,
  onRemoveIssue,
  onToggleExpanded,
  expandedIssues,
  savedCases,
  caseIndex,
  onAddAuthority,
  onRemoveAuthority,
  activeIssueId,
  setActiveIssueId,
  onGenerateOutline,
  onRegenerateOutline,
  outlineSummary,
  pending,
  error,
}: {
  issues: DraftIssue[];
  issueEdits: Record<string, IssueEdit>;
  onIssueEdit: (id: string, patch: Partial<IssueEdit>) => void;
  onSaveIssue: (id: string) => void;
  onAddIssue: () => void;
  onRemoveIssue: (id: string) => void;
  onToggleExpanded: (id: string) => void;
  expandedIssues: Record<string, boolean>;
  savedCases: SavedCase[];
  caseIndex: CaseIndexItem[];
  onAddAuthority: (issueId: string, caseId: string) => void;
  onRemoveAuthority: (issueId: string, caseId: string) => void;
  activeIssueId: string | null;
  setActiveIssueId: (id: string | null) => void;
  onGenerateOutline: () => void;
  onRegenerateOutline: () => void;
  outlineSummary?: string | null;
  pending?: boolean;
  error?: string | null;
}) {
  const pickerOptions = useMemo(() => {
    const seen = new Set(savedCases.map((c) => c.id));
    const extras = caseIndex.filter((c) => !seen.has(c.id));
    return { saved: savedCases, extras };
  }, [savedCases, caseIndex]);

  return (
    <div className="tab-content">
      <div className="tab-section-header">
        <div>
          <div className="label">Step 1 of 3</div>
          <h3 className="studio-section-title">Issues for determination</h3>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onAddIssue} disabled={pending}>
          <Plus size={12} /> Add issue
        </button>
      </div>
      <p className="studio-hint">
        State each issue, add authorities from your saved cases, then write your submissions. Click an issue to make it active — then click "Add to issue" on a saved case in the sidebar.
      </p>
      {error && (
        <p className="studio-hint" style={{ color: "var(--danger, #c0392b)" }} role="alert">
          {error}
        </p>
      )}

      {issues.length === 0 && (
        <div className="studio-empty">
          <h4>No issues yet</h4>
          <p>
            Start by stating the first issue for determination, or generate a skeleton from the
            authorities saved to this matter.
          </p>
          <button className="btn btn-primary btn-sm" onClick={onAddIssue} disabled={pending}>
            <Plus size={12} /> Add the first issue
          </button>
        </div>
      )}

      <div className="issues-list">
        {issues.map((issue, idx) => {
          const isActive = activeIssueId === issue.id;
          const edit = issueEdits[issue.id] ?? { text: issue.text, submission: issue.submission };
          const expanded = expandedIssues[issue.id] ?? false;
          return (
            <div
              key={issue.id}
              className={cn("issue-card", isActive && "active")}
              onClick={() => setActiveIssueId(isActive ? null : issue.id)}
            >
              <div className="issue-card-head">
                <div className="issue-num display">{String(idx + 1).padStart(2, "0")}</div>
                <input
                  className="issue-text-input"
                  placeholder="State the issue for determination…"
                  value={edit.text}
                  onChange={(e) => onIssueEdit(issue.id, { text: e.target.value })}
                  onBlur={() => onSaveIssue(issue.id)}
                  onClick={(e) => e.stopPropagation()}
                  disabled={pending}
                />
                <div className="issue-head-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="icon-btn"
                    onClick={() => onToggleExpanded(issue.id)}
                    title={expanded ? "Collapse" : "Expand"}
                  >
                    {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <button
                    className="icon-btn danger"
                    onClick={() => onRemoveIssue(issue.id)}
                    title="Remove issue"
                    disabled={pending}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {expanded && (
                <div className="issue-body" onClick={(e) => e.stopPropagation()}>
                  <div className="issue-subsection-label">Authorities</div>
                  {issue.authorities.length === 0 ? (
                    <div className="issue-auth-empty">
                      No authorities yet — select a saved case and click "Add to issue"
                    </div>
                  ) : (
                    <div className="issue-auth-list">
                      {issue.authorities.map((cid) => {
                        const c = resolveCase(cid, savedCases, caseIndex);
                        return (
                          <div className="issue-auth-item" key={cid}>
                            <div className="issue-auth-info">
                              {isSavedCase(c) && (
                                <span className={cn("treatment-pill", tcls[c.treatment])}>
                                  {c.treatment}
                                </span>
                              )}
                              {"unresolved" in c && c.unresolved && (
                                <span className="treatment-pill questioned">Unresolved</span>
                              )}
                              <span className="issue-auth-name">{c.title}</span>
                              <span className="issue-auth-cite">{c.citation}</span>
                            </div>
                            <button
                              className="icon-btn danger"
                              onClick={() => onRemoveAuthority(issue.id, cid)}
                              disabled={pending}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="issue-subsection-label" style={{ marginTop: 14 }}>
                    Attach authority
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <select
                      className="form-input"
                      defaultValue=""
                      disabled={pending}
                      onChange={(e) => {
                        const caseId = e.target.value;
                        if (caseId) {
                          onAddAuthority(issue.id, caseId);
                          e.target.value = "";
                        }
                      }}
                    >
                      <option value="">Choose an authority…</option>
                      <optgroup label="Matter cases">
                        {pickerOptions.saved.map((c) => (
                          <option
                            key={c.id}
                            value={c.id}
                            disabled={issue.authorities.includes(c.id)}
                          >
                            {c.title}
                          </option>
                        ))}
                      </optgroup>
                      {pickerOptions.extras.length > 0 && (
                        <optgroup label="Archive index">
                          {pickerOptions.extras.map((c) => (
                            <option
                              key={c.id}
                              value={c.id}
                              disabled={issue.authorities.includes(c.id)}
                            >
                              {c.title}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  <div className="issue-subsection-label">Submissions</div>
                  <textarea
                    className="submission-area"
                    placeholder="Write your submissions on this issue in response to the authorities above…"
                    value={edit.submission}
                    onChange={(e) => onIssueEdit(issue.id, { submission: e.target.value })}
                    onBlur={() => onSaveIssue(issue.id)}
                    rows={4}
                    disabled={pending}
                  />
                  <div style={{ marginTop: 8 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => onSaveIssue(issue.id)}
                      disabled={pending}
                    >
                      Save issue
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {issues.length > 0 && (
        <div className="tab-actions">
          {outlineSummary && (
            <p className="studio-outline-summary" role="status" aria-live="polite">
              {outlineSummary}
            </p>
          )}
          <p className="studio-hint" style={{ marginBottom: 8 }}>
            Generate adds any missing issues from your authorities without changing what you have written.
            Regenerate replaces every issue and submission.
          </p>
          <div className="tab-actions-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onGenerateOutline}
              disabled={pending}
            >
              Generate missing issues <FileText size={14} />
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onRegenerateOutline}
              disabled={pending}
            >
              Regenerate all issues
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bundle tab ───────────────────────────────────────────────────────────────

function BundleTab({
  savedCases,
  caseIndex,
  bundleOrder,
  bundleDetails,
  onDetailsChange,
  onDetailsBlur,
  onMove,
  onRemove,
  onAddAll,
  onExport,
  pending,
  error,
  indexError,
}: {
  savedCases: SavedCase[];
  caseIndex: CaseIndexItem[];
  bundleOrder: string[];
  bundleDetails: BundleDetails;
  onDetailsChange: (patch: Partial<BundleDetails>) => void;
  onDetailsBlur: () => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onRemove: (id: string) => void;
  onAddAll: () => void;
  onExport: () => void;
  pending?: boolean;
  error?: string | null;
  indexError?: string | null;
}) {
  const ordered = bundleOrder.map((id) => resolveCase(id, savedCases, caseIndex));

  return (
    <div className="tab-content">
      <div className="tab-section-header">
        <div>
          <div className="label">Step 2 of 3</div>
          <h3 className="studio-section-title">Court bundle</h3>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onExport} disabled={pending}>
          <Download size={12} /> Export bundle
        </button>
      </div>
      <p className="studio-hint">
        Arrange your cases in the order you want them to appear in the bundle. Fill in the suit details — these will appear on the bundle cover.
      </p>
      {error && (
        <p className="studio-hint" style={{ color: "var(--danger, #c0392b)" }} role="alert">
          {error}
        </p>
      )}
      {indexError && (
        <p className="studio-hint" style={{ color: "var(--danger, #c0392b)" }} role="alert">
          {indexError}
        </p>
      )}

      <div className="bundle-grid">
        <div className="bundle-details-panel">
          <div className="studio-subsection-title">Suit details</div>
          {([
            ["court", "Court"],
            ["location", "Holden at"],
            ["suitNo", "Suit number"],
            ["appellant", "Appellant / Claimant"],
            ["respondent", "Respondent / Defendant"],
          ] as [keyof BundleDetails, string][]).map(([key, label]) => (
            <div className="bundle-field" key={key}>
              <label className="form-label">{label}</label>
              <input
                className="form-input"
                value={bundleDetails[key]}
                onChange={(e) => onDetailsChange({ [key]: e.target.value })}
                onBlur={onDetailsBlur}
                placeholder={label}
                disabled={pending}
              />
            </div>
          ))}
        </div>

        <div className="bundle-cases-panel">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
            <div className="studio-subsection-title" style={{ margin: 0 }}>Cases · {ordered.length}</div>
            {savedCases.length > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={onAddAll} disabled={pending}>
                <Plus size={12} /> Add all matter authorities
              </button>
            )}
          </div>
          {ordered.length === 0 ? (
            <div className="bundle-empty">
              No cases in bundle. Add cases from the sidebar or use &ldquo;Add all matter authorities&rdquo;.
            </div>
          ) : (
            <div className="bundle-list">
              {ordered.map((c, idx) => (
                <div className="bundle-item" key={c.id}>
                  <div className="bundle-item-num display">{idx + 1}</div>
                  <div className="bundle-item-info">
                    <div className="bundle-item-title">
                      {c.title}
                      {"unresolved" in c && c.unresolved && (
                        <span style={{ marginLeft: 8, fontSize: "0.85em", opacity: 0.7 }}>
                          (unresolved authority)
                        </span>
                      )}
                    </div>
                    <div className="bundle-item-cite">{c.citation}</div>
                  </div>
                  <div className="bundle-item-actions">
                    <button
                      className="icon-btn"
                      onClick={() => onMove(c.id, -1)}
                      disabled={idx === 0 || pending}
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => onMove(c.id, 1)}
                      disabled={idx === ordered.length - 1 || pending}
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      className="icon-btn danger"
                      onClick={() => onRemove(c.id)}
                      disabled={pending}
                    >
                      <Trash2 size={13} />
                    </button>
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

function BriefTab({
  issues,
  brief,
  onBriefChange,
  onBriefBlur,
  onExport,
  pending,
  error,
}: {
  issues: DraftIssue[];
  brief: Brief;
  onBriefChange: (patch: Partial<Brief>) => void;
  onBriefBlur: () => void;
  onExport: () => void;
  pending?: boolean;
  error?: string | null;
}) {
  function patch(key: keyof Brief, value: string) {
    onBriefChange({ [key]: value });
  }

  return (
    <div className="tab-content">
      <div className="tab-section-header">
        <div>
          <div className="label">Step 3 of 3</div>
          <h3 className="studio-section-title">Written address</h3>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onExport} disabled={pending}>
          <Download size={12} /> Export brief
        </button>
      </div>
      <p className="studio-hint">
        Your issues and authorities from the Arguments tab are carried over. Fill in the parties, write your arguments, and export a formatted written address.
      </p>
      {error && (
        <p className="studio-hint" style={{ color: "var(--danger, #c0392b)" }} role="alert">
          {error}
        </p>
      )}

      <div className="brief-document">
        <div className="brief-heading-block">
          <div className="brief-court-line">
            IN THE{" "}
            <AutoSizeInput
              className="brief-inline-input"
              value={brief.court}
              onChange={(v) => patch("court", v)}
              onBlur={onBriefBlur}
              placeholder="COURT NAME"
              disabled={pending}
              minWidth={100}
            />
            {" "} OF NIGERIA
          </div>
          <div className="brief-court-line">
            HOLDEN AT{" "}
            <AutoSizeInput
              className="brief-inline-input"
              value={brief.location}
              onChange={(v) => patch("location", v)}
              onBlur={onBriefBlur}
              placeholder="LOCATION"
              disabled={pending}
              minWidth={80}
            />
          </div>
          <div className="brief-suit-line">
            SUIT NO:{" "}
            <AutoSizeInput
              className="brief-inline-input"
              value={brief.suitNo}
              onChange={(v) => patch("suitNo", v)}
              onBlur={onBriefBlur}
              placeholder="SC/0000/0000"
              disabled={pending}
              minWidth={100}
            />
          </div>
        </div>

        <div className="brief-parties-block">
          <div className="brief-party-row">
            <AutoSizeInput
              className="brief-party-input"
              value={brief.appellant}
              onChange={(v) => patch("appellant", v)}
              onBlur={onBriefBlur}
              placeholder="APPELLANT / CLAIMANT"
              disabled={pending}
              minWidth={200}
            />
            <span className="brief-party-role">…APPELLANT</span>
          </div>
          <div className="brief-party-and">AND</div>
          <div className="brief-party-row">
            <AutoSizeInput
              className="brief-party-input"
              value={brief.respondent}
              onChange={(v) => patch("respondent", v)}
              onBlur={onBriefBlur}
              placeholder="RESPONDENT / DEFENDANT"
              disabled={pending}
              minWidth={200}
            />
            <span className="brief-party-role">…RESPONDENT</span>
          </div>
        </div>

        <div className="brief-doc-title">WRITTEN ADDRESS</div>

        <div className="brief-section">
          <div className="brief-section-heading">INTRODUCTION</div>
          <AutoSizeTextarea
            className="brief-textarea"
            value={brief.intro}
            onChange={(v) => patch("intro", v)}
            onBlur={onBriefBlur}
            placeholder="Set out the nature of the proceedings, the relief sought, and a brief summary of the facts…"
            minRows={3}
            disabled={pending}
          />
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
                  {issue.submission ? (
                    <p>{issue.submission}</p>
                  ) : (
                    <textarea
                      className="brief-textarea"
                      placeholder={`Write your argument on Issue ${idx + 1}…`}
                      rows={4}
                      disabled
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="brief-section">
          <div className="brief-section-heading">CONCLUSION</div>
          <AutoSizeTextarea
            className="brief-textarea"
            value={brief.conclusion}
            onChange={(v) => patch("conclusion", v)}
            onBlur={onBriefBlur}
            placeholder="Summarise your arguments and reiterate the relief sought…"
            minRows={2}
            disabled={pending}
          />
        </div>

        <div className="brief-section">
          <div className="brief-section-heading">RELIEF SOUGHT</div>
          <AutoSizeTextarea
            className="brief-textarea"
            value={brief.relief}
            onChange={(v) => patch("relief", v)}
            onBlur={onBriefBlur}
            placeholder="State precisely the orders you are inviting the court to make…"
            minRows={2}
            disabled={pending}
          />
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
  const [draftId, setDraftId] = useState<string | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);

  const [tab, setTab] = useState<StudioTab>("arguments");
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null);
  const [expandedIssues, setExpandedIssues] = useState<Record<string, boolean>>({});
  const [issueEdits, setIssueEdits] = useState<Record<string, IssueEdit>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [bundleDetailsDraft, setBundleDetailsDraft] = useState<BundleDetails | null>(null);
  const [briefDraft, setBriefDraft] = useState<Brief | null>(null);
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);
  const [pendingAbandon, setPendingAbandon] = useState<
    { kind: "new-draft" } | { kind: "link-matter"; matterId: string } | null
  >(null);
  const [outlineSummary, setOutlineSummary] = useState<string | null>(null);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const draftsTriggerRef = useRef<HTMLButtonElement>(null);
  const draftsMenuRef = useDismissable<HTMLDivElement>(draftsOpen, () => setDraftsOpen(false), draftsTriggerRef);

  const bootstrap = useCallback(async () => {
    setBooting(true);
    setBootError(null);
    try {
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (stored) {
        try {
          await draftsApi.detail(stored);
          setDraftId(stored);
          return;
        } catch (err) {
          if (err instanceof ApiError && (err.status === 404 || err.status === 403)) {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
          } else {
            throw err;
          }
        }
      }
      const created = await draftsApi.create({});
      localStorage.setItem(DRAFT_STORAGE_KEY, created.id);
      setDraftId(created.id);
    } catch (err) {
      setBootError(err instanceof Error ? err.message : "Failed to load draft workspace.");
    } finally {
      setBooting(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const draftQuery = useApiQuery(
    draftId ? `draft:${draftId}` : null,
    () => draftsApi.detail(draftId!),
  );

  const mattersQuery = useApiQuery("matters:all", () => mattersApi.list("all"));
  const draftsListQuery = useApiQuery("drafts:list", () => draftsApi.list({ limit: 30 }));
  const caseIndexQuery = useApiQuery("cases:index", () => casesApi.index());

  const draft = draftQuery.data;

  const linkedMatterId =
    draft?.matterId &&
    !(mattersQuery.data ?? []).some((m) => m.id === draft.matterId)
      ? draft.matterId
      : null;

  const linkedMatterQuery = useApiQuery(
    linkedMatterId ? `matter:${linkedMatterId}` : null,
    () => mattersApi.detail(linkedMatterId!),
  );

  const matters = useMemo(() => {
    const list = mattersQuery.data ?? [];
    const linked = linkedMatterQuery.data;
    if (linked && !list.some((m) => m.id === linked.id)) {
      return [...list, linked];
    }
    return list;
  }, [mattersQuery.data, linkedMatterQuery.data]);

  // Unsaved edits to an issue survive a refetch; only issues new to the server are seeded.
  const draftIssues = draft?.issues;
  useEffect(() => {
    if (!draftIssues) return;
    setIssueEdits((prev) => {
      const next: Record<string, IssueEdit> = {};
      for (const issue of draftIssues) {
        next[issue.id] = prev[issue.id] ?? { text: issue.text, submission: issue.submission };
      }
      return next;
    });
  }, [draftIssues]);

  const draftBundleDetails = draft?.bundleDetails;
  const draftBrief = draft?.brief;
  useEffect(() => {
    if (!draftBundleDetails || !draftBrief) return;
    setBundleDetailsDraft(draftBundleDetails);
    setBriefDraft(draftBrief);
  }, [draftBundleDetails, draftBrief]);

  const applyDraft = useCallback(
    (workspace: DraftWorkspace) => {
      draftQuery.setData(workspace);
    },
    [draftQuery],
  );

  const createDraft = useApiMutation((body: { matterId?: string }) => draftsApi.create(body));
  const removeDraftMut = useApiMutation((id: string) => draftsApi.remove(id));
  const createIssue = useApiMutation((body: { text: string; submission?: string }) =>
    draftsApi.createIssue(draftId!, body),
  );
  const updateIssueMut = useApiMutation(
    (issueId: string, body: { text?: string; submission?: string; authorities?: string[] }) =>
      draftsApi.updateIssue(draftId!, issueId, body),
  );
  const deleteIssueMut = useApiMutation((issueId: string) =>
    draftsApi.deleteIssue(draftId!, issueId),
  );
  const addAuthorityMut = useApiMutation((issueId: string, caseId: string) =>
    draftsApi.addAuthority(draftId!, issueId, caseId),
  );
  const updateBundleOrderMut = useApiMutation((caseIds: string[]) =>
    draftsApi.updateBundleOrder(draftId!, caseIds),
  );
  const updateBundleDetailsMut = useApiMutation((body: Partial<BundleDetails>) =>
    draftsApi.updateBundleDetails(draftId!, body),
  );
  const updateBriefMut = useApiMutation((body: Partial<Brief>) =>
    draftsApi.updateBrief(draftId!, body),
  );
  const generateOutlineMut = useApiMutation((regenerate: boolean) =>
    draftsApi.generateOutline(draftId!, regenerate),
  );
  const exportBundleMut = useApiMutation(() => draftsApi.exportBundle(draftId!));
  const exportBriefMut = useApiMutation(() => draftsApi.exportBrief(draftId!));

  const pending =
    createDraft.pending ||
    createIssue.pending ||
    updateIssueMut.pending ||
    deleteIssueMut.pending ||
    addAuthorityMut.pending ||
    updateBundleOrderMut.pending ||
    updateBundleDetailsMut.pending ||
    updateBriefMut.pending ||
    generateOutlineMut.pending ||
    exportBundleMut.pending ||
    exportBriefMut.pending ||
    removeDraftMut.pending;

  function resetEditorState(workspace: DraftWorkspace) {
    setExpandedIssues({});
    setActiveIssueId(null);
    setNoteDrafts({});
    setIssueEdits(
      Object.fromEntries(
        workspace.issues.map((issue) => [
          issue.id,
          { text: issue.text, submission: issue.submission },
        ]),
      ),
    );
    setBundleDetailsDraft(workspace.bundleDetails);
    setBriefDraft(workspace.brief);
  }

  async function switchDraft(workspace: DraftWorkspace, message: string) {
    localStorage.setItem(DRAFT_STORAGE_KEY, workspace.id);
    setDraftId(workspace.id);
    applyDraft(workspace);
    resetEditorState(workspace);
    onAction(message);
  }

  async function handleNewDraft() {
    if (!draft) return;
    const hasContent = draftHasContent(
      draft,
      issueEdits,
      noteDrafts,
      bundleDetailsDraft,
      briefDraft,
    );
    if (hasContent) {
      setPendingAbandon({ kind: "new-draft" });
      return;
    }
    await startNewDraft();
  }

  async function startNewDraft(matterId?: string) {
    const result = await createDraft.mutate(matterId ? { matterId } : {});
    if (result) {
      if (draftsListQuery.data) {
        draftsListQuery.refetch();
      }
      await switchDraft(
        result,
        matterId
          ? "New draft started and linked to matter — previous work was not saved."
          : "New draft started — previous work was not saved.",
      );
    }
  }

  async function handleLinkMatter(matterId: string) {
    if (!matterId || !draft) return;
    if (matterId === draft.matterId) return;

    const hasContent = draftHasContent(
      draft,
      issueEdits,
      noteDrafts,
      bundleDetailsDraft,
      briefDraft,
    );
    if (hasContent) {
      setPendingAbandon({ kind: "link-matter", matterId });
      return;
    }
    await startNewDraft(matterId);
  }

  async function confirmAbandon() {
    if (!pendingAbandon) return;
    if (pendingAbandon.kind === "new-draft") {
      setPendingAbandon(null);
      await startNewDraft();
    } else {
      const { matterId } = pendingAbandon;
      setPendingAbandon(null);
      await startNewDraft(matterId);
    }
  }

  async function handleOpenDraft(id: string) {
    if (id === draftId) {
      setDraftsOpen(false);
      return;
    }
    try {
      const workspace = await draftsApi.detail(id);
      await switchDraft(workspace, "Draft opened.");
      setDraftsOpen(false);
    } catch (err) {
      onAction(err instanceof Error ? err.message : "Could not open draft.");
    }
  }

  function requestDeleteDraft(summary: { id: string; label: string }) {
    setConfirm({
      title: "Delete draft?",
      body: (
        <>
          <strong>{summary.label}</strong> and all issues, notes, and bundle work will be permanently deleted.
        </>
      ),
      confirmLabel: "Delete draft",
      destructive: true,
      onConfirm: async () => {
        const result = await removeDraftMut.mutate(summary.id);
        if (result?.deleted) {
          if (draftsListQuery.data) {
            draftsListQuery.setData({
              ...draftsListQuery.data,
              data: draftsListQuery.data.data.filter((d) => d.id !== summary.id),
              meta: {
                ...draftsListQuery.data.meta,
                total: Math.max(0, draftsListQuery.data.meta.total - 1),
              },
            });
          }
          if (summary.id === draftId) {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
            setDraftId(null);
            await bootstrap();
          }
          onAction("Draft deleted.");
        }
        setConfirm(null);
      },
    });
  }

  function handleIssueEdit(id: string, patch: Partial<IssueEdit>) {
    setIssueEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  }

  async function handleSaveIssue(issueId: string) {
    if (!draft) return;
    const edit = issueEdits[issueId];
    const issue = draft.issues.find((i) => i.id === issueId);
    if (!edit || !issue) return;
    if (edit.text === issue.text && edit.submission === issue.submission) return;
    const result = await updateIssueMut.mutate(issueId, {
      text: edit.text,
      submission: edit.submission,
    });
    if (result) {
      applyDraft(result);
      onAction("Issue saved.");
    }
  }

  async function handleAddIssue() {
    const result = await createIssue.mutate({ text: "New issue", submission: "" });
    if (result) {
      applyDraft(result);
      const newIssue = result.issues[result.issues.length - 1];
      if (newIssue) {
        setExpandedIssues((prev) => ({ ...prev, [newIssue.id]: true }));
        setActiveIssueId(newIssue.id);
        setIssueEdits((prev) => ({
          ...prev,
          [newIssue.id]: { text: "", submission: "" },
        }));
      }
      onAction("Issue added.");
    }
  }

  async function handleRemoveIssue(issueId: string) {
    const result = await deleteIssueMut.mutate(issueId);
    if (result) {
      applyDraft(result);
      if (activeIssueId === issueId) setActiveIssueId(null);
      onAction("Issue removed.");
    }
  }

  async function handleAddAuthority(issueId: string, caseId: string) {
    const result = await addAuthorityMut.mutate(issueId, caseId);
    if (result) {
      applyDraft(result);
      onAction("Authority attached.");
    }
  }

  async function handleRemoveAuthority(issueId: string, caseId: string) {
    if (!draft) return;
    const issue = draft.issues.find((i) => i.id === issueId);
    if (!issue) return;
    const authorities = issue.authorities.filter((a) => a !== caseId);
    const result = await updateIssueMut.mutate(issueId, { authorities });
    if (result) {
      applyDraft(result);
      onAction("Authority removed.");
    }
  }

  async function handleAddToIssue(caseId: string) {
    if (!activeIssueId) return;
    await handleAddAuthority(activeIssueId, caseId);
  }

  async function handleGenerateOutline(regenerate = false) {
    const result = await generateOutlineMut.mutate(regenerate);
    if (result) {
      applyDraft(result);
      setIssueEdits(
        Object.fromEntries(
          result.issues.map((issue) => [
            issue.id,
            { text: issue.text, submission: issue.submission },
          ]),
        ),
      );
      const added = result.addedIssueIds.length;
      const preserved = result.preservedIssueIds.length;
      const summary =
        added === 0
          ? `No new issues added — ${preserved} existing issue${preserved !== 1 ? "s" : ""} kept unchanged.`
          : `${added} issue${added !== 1 ? "s" : ""} added, ${preserved} kept from your edits.`;
      setOutlineSummary(summary);
      onAction(regenerate ? "Outline regenerated." : "Missing issues generated.");
    }
  }

  function requestRegenerateOutline() {
    setConfirm({
      title: "Regenerate all issues?",
      body: (
        <>
          Every issue and submission on this draft will be deleted and replaced with a freshly generated
          outline. Your written address and bundle order are not affected, but issue text cannot be recovered.
        </>
      ),
      confirmLabel: "Regenerate outline",
      destructive: true,
      onConfirm: async () => {
        setConfirm(null);
        await handleGenerateOutline(true);
      },
    });
  }

  async function handleMoveBundle(id: string, dir: -1 | 1) {
    if (!draft) return;
    const idx = draft.bundleOrder.indexOf(id);
    if (idx === -1) return;
    const next = [...draft.bundleOrder];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    const result = await updateBundleOrderMut.mutate(next);
    if (result) {
      applyDraft(result);
      onAction("Bundle order updated.");
    }
  }

  async function handleRemoveFromBundle(id: string) {
    if (!draft) return;
    const next = draft.bundleOrder.filter((cid) => cid !== id);
    const result = await updateBundleOrderMut.mutate(next);
    if (result) {
      applyDraft(result);
      onAction("Case removed from bundle.");
    }
  }

  async function handleAddToBundle(caseId: string) {
    if (!draft || draft.bundleOrder.includes(caseId)) return;
    const result = await updateBundleOrderMut.mutate([...draft.bundleOrder, caseId]);
    if (result) {
      applyDraft(result);
      onAction("Case added to bundle.");
    }
  }

  async function handleAddAllToBundle() {
    if (!draft) return;
    const toAdd = draft.cases.map((c) => c.id).filter((id) => !draft.bundleOrder.includes(id));
    if (toAdd.length === 0) return;
    const result = await updateBundleOrderMut.mutate([...draft.bundleOrder, ...toAdd]);
    if (result) {
      applyDraft(result);
      onAction(`${toAdd.length} case${toAdd.length === 1 ? "" : "s"} added to bundle.`);
    }
  }

  async function handleBundleDetailsBlur() {
    if (!draft) return;
    const d = bundleDetailsDraft ?? draft.bundleDetails;
    const b = draft.bundleDetails;
    if (
      d.court === b.court &&
      d.location === b.location &&
      d.suitNo === b.suitNo &&
      d.appellant === b.appellant &&
      d.respondent === b.respondent
    ) {
      return;
    }
    const result = await updateBundleDetailsMut.mutate(d);
    if (result) {
      applyDraft(result);
      onAction("Bundle details saved.");
    }
  }

  async function handleBriefBlur() {
    if (!draft) return;
    const d = briefDraft ?? draft.brief;
    const b = draft.brief;
    const unchanged =
      d.court === b.court &&
      d.location === b.location &&
      d.suitNo === b.suitNo &&
      d.appellant === b.appellant &&
      d.respondent === b.respondent &&
      d.intro === b.intro &&
      d.conclusion === b.conclusion &&
      d.relief === b.relief;
    if (unchanged) return;
    const result = await updateBriefMut.mutate(d);
    if (result) {
      applyDraft(result);
      onAction("Written address saved.");
    }
  }

  async function handleExportBundle() {
    const result = await exportBundleMut.mutate();
    if (result) {
      downloadExport(result);
      onAction("Bundle exported.");
    }
  }

  async function handleExportBrief() {
    const result = await exportBriefMut.mutate();
    if (result) {
      downloadExport(result);
      onAction("Written address exported.");
    }
  }

  const tabs: { id: StudioTab; label: string }[] = [
    { id: "arguments", label: "Arguments" },
    { id: "bundle", label: "Bundle" },
    { id: "brief", label: "Written address" },
  ];

  const caseIndex = caseIndexQuery.data ?? [];

  const briefIssues = useMemo(() => {
    if (!draft) return [];
    return draft.issues.map((issue) => ({
      ...issue,
      text: issueEdits[issue.id]?.text ?? issue.text,
      submission: issueEdits[issue.id]?.submission ?? issue.submission,
    }));
  }, [draft, issueEdits]);

  function matterLabel(m: Matter) {
    return `${m.ref} — ${m.name}`;
  }

  if (booting) return <LoadingState label="Loading draft workspace…" />;
  if (bootError) return <ErrorState message={bootError} onRetry={bootstrap} />;
  if (draftQuery.loading && !draft) return <LoadingState label="Loading draft…" />;
  if (draftQuery.error && !draft) {
    return <ErrorState message={draftQuery.error} onRetry={draftQuery.refetch} />;
  }
  if (!draft) return null;

  const bundleDetails = bundleDetailsDraft ?? draft.bundleDetails ?? EMPTY_BUNDLE_DETAILS;
  const brief = briefDraft ?? draft.brief ?? EMPTY_BRIEF;

  const studioErrors = [
    createDraft.error,
    mattersQuery.error,
    linkedMatterQuery.error,
  ].filter(Boolean);

  return (
    <div className="studio-shell">
      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.title ?? ""}
        body={confirm?.body ?? ""}
        confirmLabel={confirm?.confirmLabel}
        destructive={confirm?.destructive}
        busy={removeDraftMut.pending || generateOutlineMut.pending}
        onConfirm={() => void confirm?.onConfirm()}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={pendingAbandon !== null}
        title="Start a new draft?"
        body={
          pendingAbandon?.kind === "link-matter"
            ? "Linking a matter will start a new draft and discard the current draft's issues, notes, bundle, and written address."
            : "Starting a new draft will discard the current draft's issues, notes, bundle, and written address."
        }
        confirmLabel="Continue"
        destructive
        busy={createDraft.pending}
        onConfirm={() => void confirmAbandon()}
        onCancel={() => setPendingAbandon(null)}
      />
      <div className="studio-toolbar">
        <div className="studio-tabs">
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
        <div className="studio-toolbar-actions">
          {!draft.matterId && (
            <span className="studio-toolbar-hint">Link a matter to load authorities</span>
          )}
          <div className="studio-drafts-wrap" ref={draftsMenuRef}>
            <button
              ref={draftsTriggerRef}
              type="button"
              className={cn("btn btn-ghost btn-sm", draftsOpen && "active-tint")}
              aria-expanded={draftsOpen}
              aria-haspopup="menu"
              onClick={() => setDraftsOpen((v) => !v)}
            >
              <List size={12} /> Drafts
            </button>
            {draftsOpen && (
              <div className="studio-drafts-menu" role="menu" aria-label="Saved drafts">
                {draftsListQuery.loading && !draftsListQuery.data && (
                  <p className="studio-drafts-note">Loading drafts…</p>
                )}
                {draftsListQuery.error && (
                  <p className="studio-drafts-note" role="alert">{draftsListQuery.error}</p>
                )}
                {draftsListQuery.data?.data.length === 0 && (
                  <p className="studio-drafts-note">No saved drafts yet.</p>
                )}
                {(draftsListQuery.data?.data ?? []).map((d) => (
                  <div key={d.id} className={cn("studio-draft-row", d.id === draftId && "current")}>
                    <button
                      type="button"
                      className="studio-draft-open"
                      role="menuitem"
                      onClick={() => void handleOpenDraft(d.id)}
                    >
                      <span className="studio-draft-label">
                        {(d.matterName ?? d.suitNo) || "Untitled draft"}
                      </span>
                      <span className="studio-draft-meta">
                        {d.issueCount} issue{d.issueCount !== 1 ? "s" : ""} · {formatDraftDate(d.updatedAt)}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="icon-btn danger"
                      aria-label={`Delete draft ${d.matterName ?? d.suitNo}`}
                      disabled={removeDraftMut.pending}
                      onClick={() =>
                        requestDeleteDraft({
                          id: d.id,
                          label: (d.matterName ?? d.suitNo) || "Untitled draft",
                        })
                      }
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <label className="sr-only" htmlFor="studio-matter-select">Link to matter</label>
          <select
            id="studio-matter-select"
            className="form-input form-input-inline studio-matter-select"
            value={draft.matterId ?? ""}
            disabled={pending || mattersQuery.loading}
            onChange={(e) => handleLinkMatter(e.target.value)}
          >
            <option value="">
              {mattersQuery.loading ? "Loading matters…" : "Link to matter…"}
            </option>
            {matters.map((m) => (
              <option key={m.id} value={m.id}>
                {matterLabel(m)}
                {m.status === "closed" ? " (closed)" : ""}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleNewDraft} disabled={pending}>
            New draft
          </button>
        </div>
      </div>

      {studioErrors.length > 0 && (
        <p className="studio-toolbar-error" role="alert">
          {studioErrors.join(" ")}
        </p>
      )}

      <div className="studio-body">
        <CasesSidebar
          cases={draft.cases}
          onAddToIssue={handleAddToIssue}
          onAddToBundle={handleAddToBundle}
          bundleOrder={draft.bundleOrder}
          activeIssueId={tab === "arguments" ? activeIssueId : null}
          matterLinked={Boolean(draft.matterId)}
          pending={pending}
        />

        <div className="studio-main">
          {tab === "arguments" && (
            <ArgumentsTab
              issues={draft.issues}
              issueEdits={issueEdits}
              onIssueEdit={handleIssueEdit}
              onSaveIssue={handleSaveIssue}
              onAddIssue={handleAddIssue}
              onRemoveIssue={handleRemoveIssue}
              onToggleExpanded={(id) =>
                setExpandedIssues((prev) => ({ ...prev, [id]: !prev[id] }))
              }
              expandedIssues={expandedIssues}
              savedCases={draft.cases}
              caseIndex={caseIndex}
              onAddAuthority={handleAddAuthority}
              onRemoveAuthority={handleRemoveAuthority}
              activeIssueId={activeIssueId}
              setActiveIssueId={setActiveIssueId}
              onGenerateOutline={() => void handleGenerateOutline(false)}
              onRegenerateOutline={requestRegenerateOutline}
              outlineSummary={outlineSummary}
              pending={pending}
              error={
                createIssue.error ??
                updateIssueMut.error ??
                deleteIssueMut.error ??
                addAuthorityMut.error ??
                generateOutlineMut.error ??
                caseIndexQuery.error
              }
            />
          )}
          {tab === "bundle" && (
            <BundleTab
              savedCases={draft.cases}
              caseIndex={caseIndex}
              bundleOrder={draft.bundleOrder}
              bundleDetails={bundleDetails}
              onDetailsChange={(patch) =>
                setBundleDetailsDraft((prev) => ({ ...(prev ?? draft.bundleDetails), ...patch }))
              }
              onDetailsBlur={handleBundleDetailsBlur}
              onMove={handleMoveBundle}
              onRemove={handleRemoveFromBundle}
              onAddAll={handleAddAllToBundle}
              onExport={handleExportBundle}
              pending={pending}
              error={updateBundleOrderMut.error ?? updateBundleDetailsMut.error ?? exportBundleMut.error}
              indexError={caseIndexQuery.error}
            />
          )}
          {tab === "brief" && (
            <BriefTab
              issues={briefIssues}
              brief={brief}
              onBriefChange={(patch) =>
                setBriefDraft((prev) => ({ ...(prev ?? draft.brief), ...patch }))
              }
              onBriefBlur={handleBriefBlur}
              onExport={handleExportBrief}
              pending={pending}
              error={updateBriefMut.error ?? exportBriefMut.error}
            />
          )}
        </div>
      </div>
    </div>
  );
}
