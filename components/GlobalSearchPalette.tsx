"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, CornerDownLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { casesApi, searchApi } from "@/lib/api";
import type { GlobalSearchHit, GlobalSearchResult } from "@/lib/api";
import { useApiQuery } from "@/lib/api/hooks";
import { GLOBAL_SEARCH_KIND_LABELS, navigateGlobalSearchHit } from "@/lib/search/global-nav";
import { renderSearchSnippet } from "@/lib/search/snippet";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { useDashboard } from "@/contexts/DashboardContext";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";
import { parsePinpointCitation } from "@/lib/search/pinpoint-citation";

interface GlobalSearchPaletteProps {
  open: boolean;
  onClose: () => void;
}

function flattenHits(result: GlobalSearchResult | null): GlobalSearchHit[] {
  if (!result) return [];
  return result.groups.flatMap((g) => g.hits);
}

export function GlobalSearchPalette({ open, onClose }: GlobalSearchPaletteProps) {
  const router = useRouter();
  const { openCase } = useDashboard();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const trapRef = useFocusTrap<HTMLDivElement>(open, onClose);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query, open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebouncedQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  const pinpoint = useMemo(() => parsePinpointCitation(debouncedQuery), [debouncedQuery]);
  const searchQuery = useApiQuery(
    open && debouncedQuery.length > 0 && !pinpoint ? `global-search:${debouncedQuery}` : null,
    () => searchApi.global(debouncedQuery, { limit: 8 }),
  );
  const citationQuery = useApiQuery(
    open && pinpoint ? `citation-lookup:${pinpoint.elrNumber}` : null,
    () => casesApi.citationLookup(pinpoint!.elrNumber),
  );
  const pinpointCase = citationQuery.data?.exact ?? null;
  const closestCases = citationQuery.data?.closest ?? [];

  const hits = useMemo(() => flattenHits(searchQuery.data), [searchQuery.data]);
  const groups = searchQuery.data?.groups ?? [];

  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedQuery, searchQuery.data]);

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-hit-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const selectHit = useCallback(
    (hit: GlobalSearchHit) => {
      navigateGlobalSearchHit(hit, router, openCase);
      onClose();
    },
    [router, openCase, onClose],
  );

  const selectPinpoint = useCallback(() => {
    if (!pinpoint || !pinpointCase) return;
    router.push(
      pinpoint.page !== null
        ? routes.casePage(pinpointCase.id, pinpoint.page)
        : routes.case(pinpointCase.id),
    );
    onClose();
  }, [onClose, pinpoint, pinpointCase, router]);

  const selectClosest = useCallback(
    (id: string) => {
      router.push(routes.case(id));
      onClose();
    },
    [onClose, router],
  );

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (hits.length === 0) return;
      setActiveIndex((i) => (i + 1) % hits.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (hits.length === 0) return;
      setActiveIndex((i) => (i - 1 + hits.length) % hits.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (pinpointCase) {
        selectPinpoint();
        return;
      }
      const hit = hits[activeIndex];
      if (hit) selectHit(hit);
    }
  };

  let hitOffset = 0;

  if (!open) return null;

  return (
    <div className="search-palette-backdrop" onClick={onClose}>
      <div
        className="search-palette"
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search everywhere"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="search-palette-input-wrap">
          <Search size={16} />
          <input
            className="search-palette-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search judgments, legislation, dictionary, practice…"
            aria-label="Global search"
            autoComplete="off"
          />
          <kbd className="search-palette-kbd">Esc</kbd>
        </div>

        <div className="search-palette-body" ref={listRef}>
          {!debouncedQuery && (
            <p className="search-palette-hint">Type to search across the whole corpus.</p>
          )}
          {pinpoint && citationQuery.loading && citationQuery.data === null && (
            <p className="search-palette-hint">Locating citation…</p>
          )}
          {pinpoint && citationQuery.error && (
            <p className="search-palette-error">{citationQuery.error}</p>
          )}
          {pinpoint && !citationQuery.loading && !pinpointCase && citationQuery.data && (
            <p className="search-palette-hint">
              No judgment matches &ldquo;{pinpoint.reportCitation}&rdquo;
              {closestCases.length > 0 ? ". Closest citations:" : "."}
            </p>
          )}
          {debouncedQuery && searchQuery.loading && searchQuery.data === null && (
            <p className="search-palette-hint">Searching…</p>
          )}
          {debouncedQuery && searchQuery.error && (
            <p className="search-palette-error">{searchQuery.error}</p>
          )}
          {debouncedQuery && !searchQuery.loading && hits.length === 0 && searchQuery.data && (
            <p className="search-palette-hint">No results for &ldquo;{debouncedQuery}&rdquo;.</p>
          )}

          {pinpoint && pinpointCase && (
            <section className="search-palette-group">
              <h3 className="search-palette-group-label">
                {pinpoint.page !== null ? "Cited page" : "Citation"}
              </h3>
              <ul className="search-palette-list">
                <li>
                  <button
                    type="button"
                    className="search-palette-hit active"
                    data-hit-index="0"
                    onClick={selectPinpoint}
                  >
                    <span className="search-palette-hit-title">
                      {pinpoint.page !== null
                        ? `Open page ${pinpoint.page} · ${pinpointCase.title}`
                        : `Open · ${pinpointCase.title}`}
                    </span>
                    <span className="search-palette-hit-sub">
                      {pinpoint.page !== null
                        ? `${pinpoint.reportCitation}, p. ${pinpoint.page}`
                        : pinpoint.reportCitation}
                    </span>
                  </button>
                </li>
              </ul>
            </section>
          )}

          {pinpoint && !pinpointCase && closestCases.length > 0 && (
            <section className="search-palette-group">
              <h3 className="search-palette-group-label">Closest citations</h3>
              <ul className="search-palette-list">
                {closestCases.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="search-palette-hit"
                      onClick={() => selectClosest(item.id)}
                    >
                      <span className="search-palette-hit-title">{item.title}</span>
                      <span className="search-palette-hit-sub">{item.citation}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!pinpoint && groups.map((group) => {
            const groupStart = hitOffset;
            hitOffset += group.hits.length;
            return (
              <section className="search-palette-group" key={group.kind}>
                <h3 className="search-palette-group-label">
                  {GLOBAL_SEARCH_KIND_LABELS[group.kind]}
                </h3>
                <ul className="search-palette-list">
                  {group.hits.map((hit, i) => {
                    const index = groupStart + i;
                    return (
                      <li key={`${hit.kind}:${hit.refId}`}>
                        <button
                          type="button"
                          className={cn("search-palette-hit", index === activeIndex && "active")}
                          data-hit-index={index}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => selectHit(hit)}
                        >
                          <span className="search-palette-hit-title">{hit.title}</span>
                          {hit.subtitle && (
                            <span className="search-palette-hit-sub">{hit.subtitle}</span>
                          )}
                          {hit.snippet && (
                            <span className="search-palette-hit-snippet">
                              {renderSearchSnippet(hit.snippet)}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>

        <footer className="search-palette-footer">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>
              <CornerDownLeft size={10} />
            </kbd>{" "}
            open
          </span>
        </footer>
      </div>
    </div>
  );
}
