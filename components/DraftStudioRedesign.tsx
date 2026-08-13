"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus, Trash2, Search, GripVertical, Eye, EyeOff,
  Download, ChevronDown, ChevronRight, X, Check,
} from "lucide-react";
import { AutoSizeTextarea } from "@/components/AutoSizeInput";
import { cn } from "@/lib/utils";
import { casesApi, draftsApi, ApiError } from "@/lib/api";
import type {
  Brief,
  BundleDetails,
  CaseSummary,
  DraftIssue,
} from "@/lib/api";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import { LoadingState, ErrorState } from "@/components/AsyncState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { downloadExport } from "@/lib/download";
import { tcls } from "@/lib/types";

// Nigerian States for Location dropdown
const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT Abuja", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara",
];

const DRAFT_STORAGE_KEY = "lr-draft-id";

// Strip HTML tags from content (cleanup from old rich text editor)
function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

type IssueEdit = { text: string; submission: string };

// ─── Tag Input for Multiple Parties ───────────────────────────────────────────

function TagInput({
  values,
  onChange,
  onBlur,
  placeholder,
  disabled,
}: {
  values: string[];
  onChange: (vals: string[]) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setInputValue("");
    }
  };

  const removeTag = (index: number) => {
    const next = values.filter((_, i) => i !== index);
    onChange(next);
    onBlur?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !inputValue && values.length > 0) {
      removeTag(values.length - 1);
    }
  };

  return (
    <div
      className="ds-tag-input-container"
      onClick={() => inputRef.current?.focus()}
    >
      {values.map((tag, i) => (
        <span key={i} className="ds-tag-pill">
          {tag}
          <button
            type="button"
            className="ds-tag-remove"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(i);
            }}
            disabled={disabled}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        className="ds-tag-input"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          addTag();
          onBlur?.();
        }}
        placeholder={values.length === 0 ? placeholder : "Add another..."}
        disabled={disabled}
      />
    </div>
  );
}

// ─── Inline Case Search ───────────────────────────────────────────────────────

function InlineCaseSearch({
  onSelect,
  onClose,
  excludeIds = [],
}: {
  onSelect: (c: CaseSummary) => void;
  onClose: () => void;
  excludeIds?: string[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CaseSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    timeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await casesApi.search({ q, limit: 8 });
        setResults(res.data.filter((c) => !excludeIds.includes(c.id)));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
  }, [excludeIds]);

  return (
    <div className="inline-case-search">
      <div className="inline-search-input-wrap">
        <Search size={14} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search cases to add as authority..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="inline-search-input"
        />
        {searching && <span className="inline-search-spinner" />}
        <button className="inline-search-close" onClick={onClose}>
          <X size={14} />
        </button>
      </div>
      {results.length > 0 && (
        <div className="inline-search-results">
          {results.map((c) => (
            <button
              key={c.id}
              className="inline-search-result"
              onClick={() => {
                onSelect(c);
                onClose();
              }}
            >
              <div className="inline-result-title">{c.title}</div>
              <div className="inline-result-cite">{c.citation}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Issue Card ───────────────────────────────────────────────────────────────

function IssueCard({
  issue,
  index,
  edit,
  expanded,
  onToggle,
  onChange,
  onSave,
  onDelete,
  onAddAuthority,
  onRemoveAuthority,
  authorities,
  pending,
}: {
  issue: DraftIssue;
  index: number;
  edit: IssueEdit;
  expanded: boolean;
  onToggle: () => void;
  onChange: (e: IssueEdit) => void;
  onSave: () => void;
  onDelete: () => void;
  onAddAuthority: (c: CaseSummary) => void;
  onRemoveAuthority: (caseId: string) => void;
  authorities: { id: string; title: string; citation: string; treatment?: string }[];
  pending?: boolean;
}) {
  const [showSearch, setShowSearch] = useState(false);
  const hasChanges = edit.text !== issue.text || edit.submission !== issue.submission;

  return (
    <div className={cn("ds-issue-card", expanded && "expanded")}>
      <div className="ds-issue-header" onClick={onToggle}>
        <div className="ds-issue-grip">
          <GripVertical size={14} />
        </div>
        <div className="ds-issue-number">Issue {index + 1}</div>
        <div className="ds-issue-preview">
          {edit.text || <span className="ds-issue-empty">Click to add issue...</span>}
        </div>
        <div className="ds-issue-chevron">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </div>

      {expanded && (
        <div className="ds-issue-body">
          <div className="ds-field">
            <label className="ds-label">Issue for Determination</label>
            <AutoSizeTextarea
              className="ds-textarea"
              value={edit.text}
              onChange={(val) => onChange({ ...edit, text: val })}
              placeholder="Whether the learned trial judge erred in law when..."
              minRows={2}
              disabled={pending}
            />
          </div>

          <div className="ds-field">
            <label className="ds-label">Submission</label>
            <AutoSizeTextarea
              className="ds-textarea"
              value={edit.submission}
              onChange={(val) => onChange({ ...edit, submission: val })}
              placeholder="It is respectfully submitted that..."
              minRows={3}
              disabled={pending}
            />
          </div>

          <div className="ds-field">
            <label className="ds-label">
              Authorities ({authorities.length})
              <button
                className="ds-add-auth-btn"
                onClick={() => setShowSearch(true)}
                disabled={pending}
              >
                <Plus size={12} /> Add
              </button>
            </label>

            {showSearch && (
              <InlineCaseSearch
                onSelect={onAddAuthority}
                onClose={() => setShowSearch(false)}
                excludeIds={authorities.map((a) => a.id)}
              />
            )}

            {authorities.length > 0 && (
              <div className="ds-authorities">
                {authorities.map((a) => (
                  <div key={a.id} className="ds-authority">
                    <div className="ds-auth-info">
                      <span className="ds-auth-title">{a.title}</span>
                      <span className="ds-auth-cite">{a.citation}</span>
                      {a.treatment && (
                        <span className={cn("treatment-pill", tcls[a.treatment as keyof typeof tcls])}>
                          {a.treatment}
                        </span>
                      )}
                    </div>
                    <button
                      className="ds-auth-remove"
                      onClick={() => onRemoveAuthority(a.id)}
                      disabled={pending}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ds-issue-actions">
            {hasChanges && (
              <button className="btn btn-primary btn-sm" onClick={onSave} disabled={pending}>
                <Check size={12} /> Save
              </button>
            )}
            <button className="btn btn-ghost btn-sm ds-delete-btn" onClick={onDelete} disabled={pending}>
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Case Details Sidebar ─────────────────────────────────────────────────────

function parseParties(str: string): string[] {
  if (!str.trim()) return [];
  return str.split(" | ").filter(Boolean);
}

function joinParties(arr: string[]): string {
  return arr.join(" | ");
}

function CaseDetailsSidebar({
  details,
  onChange,
  onBlur,
  pending,
}: {
  details: BundleDetails;
  onChange: (d: BundleDetails) => void;
  onBlur: () => void;
  pending?: boolean;
}) {
  const appellants = parseParties(details.appellant);
  const respondents = parseParties(details.respondent);

  return (
    <aside className="ds-sidebar">
      <div className="ds-sidebar-title">Case Details</div>

      <div className="ds-sidebar-field">
        <label>Court</label>
        <select
          value={details.court}
          onChange={(e) => onChange({ ...details, court: e.target.value })}
          onBlur={onBlur}
          disabled={pending}
          className="ds-select"
        >
          <option value="">Select court...</option>
          <option value="Supreme Court of Nigeria">Supreme Court of Nigeria</option>
          <option value="Court of Appeal">Court of Appeal</option>
          <option value="Federal High Court">Federal High Court</option>
          <option value="National Industrial Court">National Industrial Court</option>
          <option value="High Court">State High Court</option>
          <option value="Customary Court of Appeal">Customary Court of Appeal</option>
          <option value="Sharia Court of Appeal">Sharia Court of Appeal</option>
          <option value="Magistrate Court">Magistrate Court</option>
        </select>
      </div>

      <div className="ds-sidebar-field">
        <label>Location</label>
        <select
          value={details.location}
          onChange={(e) => onChange({ ...details, location: e.target.value })}
          onBlur={onBlur}
          disabled={pending}
          className="ds-select"
        >
          <option value="">Select state...</option>
          {NIGERIAN_STATES.map((state) => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </div>

      <div className="ds-sidebar-field">
        <label>Suit Number</label>
        <input
          type="text"
          value={details.suitNo}
          onChange={(e) => onChange({ ...details, suitNo: e.target.value })}
          onBlur={onBlur}
          placeholder="SC/CV/123/2026"
          disabled={pending}
        />
      </div>

      <div className="ds-sidebar-divider" />

      <div className="ds-sidebar-field">
        <label>Appellant / Claimant</label>
        <TagInput
          values={appellants}
          onChange={(vals) => onChange({ ...details, appellant: joinParties(vals) })}
          onBlur={onBlur}
          placeholder="Type name and press Enter"
          disabled={pending}
        />
        <span className="ds-field-hint">Press Enter to add multiple parties</span>
      </div>

      <div className="ds-sidebar-field">
        <label>Respondent / Defendant</label>
        <TagInput
          values={respondents}
          onChange={(vals) => onChange({ ...details, respondent: joinParties(vals) })}
          onBlur={onBlur}
          placeholder="Type name and press Enter"
          disabled={pending}
        />
        <span className="ds-field-hint">Press Enter to add multiple parties</span>
      </div>
    </aside>
  );
}

// ─── Preview Panel ────────────────────────────────────────────────────────────

function PreviewPanel({
  details,
  brief,
  issues,
  authorities,
}: {
  details: BundleDetails;
  brief: Brief;
  issues: { text: string; submission: string; authorities: string[] }[];
  authorities: Record<string, { title: string; citation: string }>;
}) {
  const appellants = parseParties(details.appellant);
  const respondents = parseParties(details.respondent);

  return (
    <div className="ds-preview">
      <div className="ds-preview-header">
        <div className="ds-preview-court">
          IN THE {(details.court || "___________").toUpperCase()}
        </div>
        <div className="ds-preview-location">
          HOLDEN AT {(details.location || "___________").toUpperCase()}
        </div>
        <div className="ds-preview-suit">SUIT NO: {details.suitNo || "___________"}</div>
      </div>

      <div className="ds-preview-parties">
        <div className="ds-preview-party">
          <div className="ds-preview-party-names">
            {appellants.length > 0
              ? appellants.map((name, i) => <div key={i}>{name}</div>)
              : "_______________"}
          </div>
          <span className="ds-preview-role">
            ...APPELLANT{appellants.length > 1 ? "S" : ""}
          </span>
        </div>
        <div className="ds-preview-and">AND</div>
        <div className="ds-preview-party">
          <div className="ds-preview-party-names">
            {respondents.length > 0
              ? respondents.map((name, i) => <div key={i}>{name}</div>)
              : "_______________"}
          </div>
          <span className="ds-preview-role">
            ...RESPONDENT{respondents.length > 1 ? "S" : ""}
          </span>
        </div>
      </div>

      <div className="ds-preview-title">WRITTEN ADDRESS</div>

      {brief.intro && (
        <div className="ds-preview-section">
          <div className="ds-preview-section-title">INTRODUCTION</div>
          <div dangerouslySetInnerHTML={{ __html: brief.intro }} />
        </div>
      )}

      {issues.map((issue, i) => (
        <div key={i} className="ds-preview-section">
          <div className="ds-preview-section-title">ISSUE {i + 1}</div>
          <p className="ds-preview-issue-text">{issue.text}</p>
          {issue.submission && <p>{issue.submission}</p>}
          {issue.authorities.length > 0 && (
            <div className="ds-preview-auths">
              <em>See: </em>
              {issue.authorities.map((id, j) => (
                <span key={id}>
                  {authorities[id]?.citation || id}
                  {j < issue.authorities.length - 1 ? "; " : ""}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      {brief.conclusion && (
        <div className="ds-preview-section">
          <div className="ds-preview-section-title">CONCLUSION</div>
          <div dangerouslySetInnerHTML={{ __html: brief.conclusion }} />
        </div>
      )}

      {brief.relief && (
        <div className="ds-preview-section">
          <div className="ds-preview-section-title">RELIEF SOUGHT</div>
          <div dangerouslySetInnerHTML={{ __html: brief.relief }} />
        </div>
      )}

      <div className="ds-preview-sig">
        <div className="ds-preview-sig-line" />
        <div>Counsel for the Appellant</div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const EMPTY_DETAILS: BundleDetails = {
  court: "",
  location: "",
  suitNo: "",
  appellant: "",
  respondent: "",
};

const EMPTY_BRIEF: Brief = {
  ...EMPTY_DETAILS,
  intro: "",
  conclusion: "",
  relief: "",
};

export function DraftStudioRedesign({ onAction }: { onAction: (m: string) => void }) {
  const [draftId, setDraftId] = useState<string | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const [expandedIssues, setExpandedIssues] = useState<Record<string, boolean>>({});
  const [issueEdits, setIssueEdits] = useState<Record<string, IssueEdit>>({});
  const [detailsDraft, setDetailsDraft] = useState<BundleDetails>(EMPTY_DETAILS);
  const [briefDraft, setBriefDraft] = useState<Brief>(EMPTY_BRIEF);
  const [confirm, setConfirm] = useState<{
    title: string;
    body: React.ReactNode;
    onConfirm: () => void;
  } | null>(null);

  // Bootstrap
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
      setBootError(err instanceof Error ? err.message : "Failed to load workspace.");
    } finally {
      setBooting(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // Queries
  const draftQuery = useApiQuery(
    draftId ? `draft:${draftId}` : null,
    () => draftsApi.detail(draftId!),
  );

  const draft = draftQuery.data;

  // Sync edits from server
  useEffect(() => {
    if (!draft) return;
    setIssueEdits((prev) => {
      const next: Record<string, IssueEdit> = {};
      for (const issue of draft.issues) {
        next[issue.id] = prev[issue.id] ?? {
          text: stripHtml(issue.text),
          submission: stripHtml(issue.submission)
        };
      }
      return next;
    });
    setDetailsDraft(draft.bundleDetails);
    // Strip HTML from brief fields (cleanup from old rich text editor)
    setBriefDraft({
      ...draft.brief,
      intro: stripHtml(draft.brief.intro),
      conclusion: stripHtml(draft.brief.conclusion),
      relief: stripHtml(draft.brief.relief),
    });
  }, [draft]);

  // Mutations
  const createIssue = useApiMutation((body: { text: string }) =>
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
  const removeAuthorityMut = useApiMutation((issueId: string, caseId: string) =>
    draftsApi.removeAuthority(draftId!, issueId, caseId),
  );
  const updateDetailsMut = useApiMutation((body: Partial<BundleDetails>) =>
    draftsApi.updateBundleDetails(draftId!, body),
  );
  const updateBriefMut = useApiMutation((body: Partial<Brief>) =>
    draftsApi.updateBrief(draftId!, body),
  );
  const exportMut = useApiMutation((format: "text" | "pdf") =>
    draftsApi.exportBrief(draftId!, format),
  );

  const pending =
    createIssue.pending ||
    updateIssueMut.pending ||
    deleteIssueMut.pending ||
    addAuthorityMut.pending ||
    updateDetailsMut.pending ||
    updateBriefMut.pending;

  // Handlers
  const handleAddIssue = async () => {
    if (!draftId) {
      console.error("[DraftStudio] No draftId available");
      onAction("Error: No draft loaded");
      return;
    }
    console.log("[DraftStudio] Adding issue, draftId:", draftId);
    const result = await createIssue.mutate({ text: "" });
    console.log("[DraftStudio] Create issue result:", result, "error:", createIssue.error);
    if (result) {
      draftQuery.setData(result);
      const newIssue = result.issues[result.issues.length - 1];
      if (newIssue) {
        setExpandedIssues((prev) => ({ ...prev, [newIssue.id]: true }));
        setIssueEdits((prev) => ({
          ...prev,
          [newIssue.id]: { text: "", submission: "" },
        }));
      }
      onAction("Issue added");
    } else if (createIssue.error) {
      onAction(`Failed: ${createIssue.error}`);
    }
  };

  const handleSaveIssue = async (issueId: string) => {
    const edit = issueEdits[issueId];
    if (!edit) return;
    const result = await updateIssueMut.mutate(issueId, {
      text: edit.text,
      submission: edit.submission,
    });
    if (result) draftQuery.setData(result);
  };

  const handleDeleteIssue = (issueId: string) => {
    setConfirm({
      title: "Delete Issue",
      body: "This will permanently delete the issue and its authorities.",
      onConfirm: async () => {
        const result = await deleteIssueMut.mutate(issueId);
        if (result) draftQuery.setData(result);
        setConfirm(null);
      },
    });
  };

  const handleAddAuthority = async (issueId: string, caseData: CaseSummary) => {
    const result = await addAuthorityMut.mutate(issueId, caseData.id);
    if (result) draftQuery.setData(result);
  };

  const handleRemoveAuthority = async (issueId: string, caseId: string) => {
    const result = await removeAuthorityMut.mutate(issueId, caseId);
    if (result) draftQuery.setData(result);
  };

  const handleDetailsChange = async (next: BundleDetails) => {
    setDetailsDraft(next);
    // Debounced save would go here
  };

  const handleDetailsBlur = async () => {
    const result = await updateDetailsMut.mutate(detailsDraft);
    if (result) draftQuery.setData(result);
  };

  const handleBriefChange = (field: keyof Brief, value: string) => {
    setBriefDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleBriefBlur = async () => {
    const result = await updateBriefMut.mutate(briefDraft);
    if (result) draftQuery.setData(result);
  };

  const handleExport = async (format: "text" | "pdf") => {
    const file = await exportMut.mutate(format);
    if (file) {
      downloadExport(file);
      onAction(`Exported as ${format.toUpperCase()}`);
    }
  };

  // Build authorities map for preview
  const authoritiesMap = useMemo(() => {
    const map: Record<string, { title: string; citation: string }> = {};
    if (draft?.cases) {
      for (const c of draft.cases) {
        map[c.id] = { title: c.title, citation: c.citation };
      }
    }
    return map;
  }, [draft?.cases]);

  // Loading / Error states
  if (booting || draftQuery.loading) {
    return <LoadingState label="Loading Draft Studio..." />;
  }

  if (bootError || draftQuery.error) {
    return <ErrorState message={bootError || draftQuery.error || "Failed to load"} />;
  }

  if (!draft) return null;

  return (
    <div className="ds-container">
      {/* Action Bar */}
      <div className="ds-action-bar">
        <button
          className={cn("btn btn-ghost btn-sm", showPreview && "active")}
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
          {showPreview ? "Hide Preview" : "Preview"}
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => handleExport("pdf")}
          disabled={exportMut.pending}
        >
          <Download size={14} /> Export PDF
        </button>
      </div>

      <div className={cn("ds-workspace", showPreview && "with-preview")}>
        {/* Main Content */}
        <main className="ds-main">
          {/* Introduction */}
          <section className="ds-section">
            <h2 className="ds-section-title">Introduction</h2>
            <AutoSizeTextarea
              className="ds-textarea"
              value={briefDraft.intro}
              onChange={(val) => handleBriefChange("intro", val)}
              onBlur={handleBriefBlur}
              placeholder="Set out the nature of the proceedings, the relief sought, and a brief summary of the facts..."
              minRows={4}
              disabled={pending}
            />
          </section>

          {/* Issues */}
          <section className="ds-section">
            <div className="ds-section-header">
              <h2 className="ds-section-title">Issues for Determination</h2>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleAddIssue}
                disabled={pending || !draftId}
              >
                <Plus size={14} /> Add Issue
              </button>
            </div>

            {createIssue.error && (
              <p className="ds-error" role="alert">
                {createIssue.error}
              </p>
            )}

            {draft.issues.length === 0 ? (
              <div className="ds-empty">
                <p>No issues added yet.</p>
                <button
                  className="btn btn-secondary"
                  onClick={handleAddIssue}
                  disabled={pending || !draftId}
                >
                  <Plus size={14} /> Add your first issue
                </button>
              </div>
            ) : (
              <div className="ds-issues">
                {draft.issues.map((issue, i) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    index={i}
                    edit={issueEdits[issue.id] ?? { text: issue.text, submission: issue.submission }}
                    expanded={expandedIssues[issue.id] ?? false}
                    onToggle={() =>
                      setExpandedIssues((prev) => ({ ...prev, [issue.id]: !prev[issue.id] }))
                    }
                    onChange={(e) => setIssueEdits((prev) => ({ ...prev, [issue.id]: e }))}
                    onSave={() => handleSaveIssue(issue.id)}
                    onDelete={() => handleDeleteIssue(issue.id)}
                    onAddAuthority={(c) => handleAddAuthority(issue.id, c)}
                    onRemoveAuthority={(caseId) => handleRemoveAuthority(issue.id, caseId)}
                    authorities={issue.authorities.map((id) => ({
                      id,
                      title: authoritiesMap[id]?.title || id,
                      citation: authoritiesMap[id]?.citation || "",
                    }))}
                    pending={pending}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Conclusion */}
          <section className="ds-section">
            <h2 className="ds-section-title">Conclusion</h2>
            <AutoSizeTextarea
              className="ds-textarea"
              value={briefDraft.conclusion}
              onChange={(val) => handleBriefChange("conclusion", val)}
              onBlur={handleBriefBlur}
              placeholder="Summarize your arguments and reiterate the relief sought..."
              minRows={4}
              disabled={pending}
            />
          </section>

          {/* Relief */}
          <section className="ds-section">
            <h2 className="ds-section-title">Relief Sought</h2>
            <AutoSizeTextarea
              className="ds-textarea"
              value={briefDraft.relief}
              onChange={(val) => handleBriefChange("relief", val)}
              onBlur={handleBriefBlur}
              placeholder="State precisely the orders you are inviting the court to make..."
              minRows={3}
              disabled={pending}
            />
          </section>
        </main>

        {/* Sidebar */}
        <CaseDetailsSidebar
          details={detailsDraft}
          onChange={handleDetailsChange}
          onBlur={handleDetailsBlur}
          pending={pending}
        />

        {/* Preview Panel */}
        {showPreview && (
          <div className="ds-preview-panel">
            <PreviewPanel
              details={detailsDraft}
              brief={briefDraft}
              issues={draft.issues.map((issue) => ({
                text: issueEdits[issue.id]?.text ?? issue.text,
                submission: issueEdits[issue.id]?.submission ?? issue.submission,
                authorities: issue.authorities,
              }))}
              authorities={authoritiesMap}
            />
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.title ?? ""}
        body={confirm?.body ?? ""}
        confirmLabel="Delete"
        destructive
        onConfirm={() => confirm?.onConfirm()}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
