"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Search, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CaseEntry } from "./CaseEntry";
import { ResearchFilters } from "./ResearchFilters";
import { SearchSyntaxHelp } from "./SearchSyntaxHelp";
import { AsyncSection, ErrorState } from "./AsyncState";
import { casesApi, catalogApi, draftsApi, researchApi } from "@/lib/api";
import type { CaseSearchParams, CaseSort, Paginated, CaseSummary } from "@/lib/api";
import { useApiMutation, useApiQuery } from "@/lib/api/hooks";
import {
  parseResearchUrl,
  researchFiltersFromState,
  serializeResearchUrl,
  type ResearchFilterState,
  type ResearchUrlState,
} from "@/lib/search/url-state";
import { useDashboard } from "@/contexts/DashboardContext";
import { cn } from "@/lib/utils";
import { alerts } from "@/lib/data";

const DRAFT_STORAGE_KEY = "lr-draft-id";
const ARCHIVE_ID = /^[A-Z]{2,4}-\d+$/;
const PAGE_SIZE = 10;

const SORT_OPTIONS: { value: CaseSort; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "strength", label: "Authority strength" },
  { value: "recent", label: "Most recent" },
  { value: "year", label: "Year" },
  { value: "title", label: "Title" },
  { value: "cited", label: "Most cited" },
];

function ResearchContent() {
  const router = useRouter();
  const urlParams = useSearchParams();
  const { openCase } = useDashboard();

  const urlKey = urlParams.toString();
  const lastSyncedUrl = useRef(urlKey);
  const skipNextSync = useRef(false);

  // Seeded from the URL so a shared or reloaded search shows its own query text.
  const [researchState, setResearchState] = useState<ResearchUrlState>(() =>
    parseResearchUrl(urlParams),
  );
  const [queryInput, setQueryInput] = useState(researchState.q);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const createDraft = useApiMutation(() => draftsApi.create({}));

  useEffect(() => {
    if (urlKey === lastSyncedUrl.current) return;
    lastSyncedUrl.current = urlKey;
    skipNextSync.current = true;
    const parsed = parseResearchUrl(urlParams);
    setResearchState(parsed);
    setQueryInput(parsed.q);
  }, [urlKey, urlParams]);

  const syncUrl = useCallback(
    (state: ResearchUrlState) => {
      const qs = serializeResearchUrl(state);
      if (qs === urlKey) return;
      lastSyncedUrl.current = qs;
      router.replace(qs ? `/dashboard?${qs}` : "/dashboard", { scroll: false });
    },
    [router, urlKey],
  );

  useEffect(() => {
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }
    syncUrl(researchState);
  }, [researchState, syncUrl]);

  const filters = researchFiltersFromState(researchState);
  const submittedQuery = researchState.q;

  const searchParams: CaseSearchParams = {
    q: submittedQuery || undefined,
    court: filters.court,
    year: filters.year,
    yearFrom: filters.yearFrom,
    yearTo: filters.yearTo,
    area: filters.area,
    digestArea: filters.digestArea,
    jurisdiction: filters.jurisdiction,
    treatment: filters.treatment,
    reportSeries: filters.reportSeries,
    ratioOnly: filters.ratioOnly,
    positiveTreatment: filters.positiveTreatment,
    verified: filters.verified,
    sort: researchState.sort,
    page: researchState.page,
    limit: PAGE_SIZE,
  };

  const filtersQuery = useApiQuery("catalog:filters", () => catalogApi.filters());

  const searchQuery = useApiQuery(
    `search:${JSON.stringify(searchParams)}`,
    () => casesApi.search(searchParams),
  );

  const authorityQuery = useApiQuery(
    `authority-map:${submittedQuery}`,
    () => researchApi.authorityMap({ q: submittedQuery || undefined }),
  );

  const patchState = useCallback((patch: Partial<ResearchUrlState>) => {
    setResearchState((prev) => ({ ...prev, ...patch }));
  }, []);

  const runSearch = useCallback(() => {
    patchState({ q: queryInput.trim(), page: 1 });
  }, [queryInput, patchState]);

  const updateFilters = useCallback((next: ResearchFilterState) => {
    setResearchState((prev) => ({
      ...prev,
      court: undefined,
      year: undefined,
      yearFrom: undefined,
      yearTo: undefined,
      area: undefined,
      digestArea: undefined,
      jurisdiction: undefined,
      treatment: undefined,
      reportSeries: undefined,
      ratioOnly: undefined,
      positiveTreatment: undefined,
      verified: undefined,
      ...next,
      page: 1,
    }));
  }, []);

  const handleGenerateSkeleton = async () => {
    const created = await createDraft.mutate();
    if (!created) return;
    localStorage.setItem(DRAFT_STORAGE_KEY, created.id);
    router.push("/dashboard/draft-studio");
  };

  return (
    <div className="page">
      <div className="search-bar">
        <div className="search-input-wrap">
          <Search />
          <input
            className="search-input"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runSearch();
            }}
            placeholder="Search judgments — try ratio:natural justice or &quot;floating charge&quot;"
            aria-label="Search query"
          />
        </div>
        <div className="search-bar-actions">
          <SearchSyntaxHelp />
          <select
            className="search-sort-select"
            value={researchState.sort}
            aria-label="Sort results"
            onChange={(e) =>
              patchState({ sort: e.target.value as CaseSort, page: 1 })
            }
          >
            {SORT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={runSearch}>
            Search corpus
          </button>
        </div>
      </div>

      <ResearchFilters
        archive={filtersQuery.data}
        filters={filters}
        onChange={updateFilters}
        expanded={filtersExpanded}
        onToggleExpanded={() => setFiltersExpanded((e) => !e)}
      />

      <div className="content-grid">
        <div>
          <div className="page-header" style={{ marginBottom: 10 }}>
            <div>
              <p className="label">
                Best matches
                {searchQuery.data && (
                  <>
                    {" "}
                    · {searchQuery.data.meta.total}{" "}
                    {searchQuery.data.meta.total === 1 ? "authority" : "authorities"}
                  </>
                )}
              </p>
              <h2>Verified authorities</h2>
            </div>
          </div>
          <div className="case-list">
            <AsyncSection
              query={searchQuery}
              loadingLabel="Searching…"
              emptyMessage="No authorities match."
              isEmpty={(d: Paginated<CaseSummary>) => d.data.length === 0}
            >
              {(data) => (
                <>
                  {data.data.map((item) => (
                    <CaseEntry key={item.id} item={item} />
                  ))}
                  {data.meta.totalPages > 1 && (
                    <div className="search-pagination">
                      <span className="search-pagination-meta">
                        Showing {(data.meta.page - 1) * data.meta.limit + 1}–
                        {Math.min(data.meta.page * data.meta.limit, data.meta.total)} of{" "}
                        {data.meta.total}
                      </span>
                      <div className="search-pagination-controls">
                        <button
                          className="btn btn-ghost btn-sm"
                          disabled={data.meta.page <= 1}
                          onClick={() => patchState({ page: data.meta.page - 1 })}
                        >
                          Previous
                        </button>
                        <span className="search-pagination-page">
                          Page {data.meta.page} of {data.meta.totalPages}
                        </span>
                        <button
                          className="btn btn-ghost btn-sm"
                          disabled={data.meta.page >= data.meta.totalPages}
                          onClick={() => patchState({ page: data.meta.page + 1 })}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </AsyncSection>
          </div>
        </div>

        <aside className="insight-stack">
          <div className="insight-panel tinted">
            <div className="insight-head">
              <div>
                <p className="label">Research assistant</p>
                <h3>Authority map</h3>
              </div>
            </div>
            <div className="authority-nodes">
              {authorityQuery.loading && authorityQuery.data === null ? (
                <p className="insight-note">Loading authority map…</p>
              ) : authorityQuery.error ? (
                <ErrorState message={authorityQuery.error} onRetry={authorityQuery.refetch} />
              ) : authorityQuery.data ? (
                authorityQuery.data.nodes.map((node, i) => {
                  const className = cn(
                    "authority-node",
                    i === 0 && "root",
                    node.strength < 75 && "dim",
                  );
                  if (ARCHIVE_ID.test(node.id)) {
                    return (
                      <button
                        type="button"
                        className={className}
                        key={node.id}
                        onClick={() => openCase(node.id)}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        {node.label}
                      </button>
                    );
                  }
                  return (
                    <div className={className} key={node.id}>
                      {node.label}
                    </div>
                  );
                })
              ) : null}
            </div>
            {authorityQuery.data && (
              <p className="insight-note">{authorityQuery.data.pathNote}</p>
            )}
            {createDraft.error && (
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "0.78rem",
                  color: "var(--color-danger, #9a3244)",
                }}
              >
                {createDraft.error}
              </p>
            )}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={createDraft.pending}
              onClick={handleGenerateSkeleton}
            >
              {createDraft.pending ? "Creating draft…" : "Generate argument skeleton"}{" "}
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="insight-panel">
            <div className="insight-head">
              <div>
                <p className="label">Court watch</p>
                <h3>Sample alerts</h3>
              </div>
              <Link href="/dashboard/court-watch" className="btn btn-link btn-sm">
                View all
              </Link>
            </div>
            <p className="insight-note">
              Illustrative feed only — the Court Watch API is not connected yet.
            </p>
            <div className="alert-feed">
              {alerts.map(({ court, topic, change, time }) => (
                <div className="alert-row" key={`${court}::${topic}`}>
                  <div className="alert-topic">{topic}</div>
                  <div className="alert-change">{change}</div>
                  <div className="alert-meta">
                    {court} · {time} ago
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function Research() {
  return (
    <Suspense fallback={<div className="page"><p className="label">Loading research…</p></div>}>
      <ResearchContent />
    </Suspense>
  );
}
