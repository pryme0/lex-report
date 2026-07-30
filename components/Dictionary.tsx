"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/contexts/DashboardContext";
import { dictionaryApi } from "@/lib/api";
import type { DictionaryEntry, DictionaryEntryDetail } from "@/lib/api";
import { useApiQuery } from "@/lib/api/hooks";
import { AsyncSection } from "./AsyncState";

type KindFilter = "all" | "term" | "maxim";

function EntryDetailView({ entry }: { entry: DictionaryEntryDetail }) {
  const { openCase } = useDashboard();

  return (
    <>
      <div className="judgment-header">
        <div>
          <div className="judgment-court-label">
            {entry.kind === "maxim" ? "Legal maxim" : "Legal term"}
          </div>
          <h2 className="judgment-title">{entry.term}</h2>
        </div>
      </div>

      <div className="judgment-section" style={{ borderTop: "none", paddingTop: 0 }}>
        <p>{entry.definition}</p>
      </div>

      {entry.sourceCaseId && (
        <div className="dict-source">
          <div className="aside-section-label">Judicial definition from</div>
          <div className="dict-source-link">
            <button
              className="authority-link-btn"
              onClick={() => openCase(entry.sourceCaseId!)}
            >
              {entry.sourceCitation ?? "Source judgment"}
            </button>
          </div>
        </div>
      )}

      <div className="aside-section-label" style={{ marginTop: entry.sourceCaseId ? 16 : 0 }}>
        Applied in
      </div>
      {entry.appliedCases.length === 0 ? (
        <p className="citator-empty">
          No judgment in this archive has applied this {entry.kind} yet.
        </p>
      ) : (
        <div className="authority-links">
          {entry.appliedCases.map((c) => (
            <button className="authority-link-btn" key={c.id} onClick={() => openCase(c.id)}>
              {c.title}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function EntryDetailLoader({ entryId, onBack }: { entryId: string; onBack: () => void }) {
  const query = useApiQuery(`dictionary:${entryId}`, () => dictionaryApi.detail(entryId));

  return (
    <div className="page">
      <button className="btn btn-link btn-sm" onClick={onBack}>
        <ArrowLeft size={13} /> Back to dictionary
      </button>
      <AsyncSection query={query} loadingLabel="Loading entry…">
        {(entry) => <EntryDetailView entry={entry} />}
      </AsyncSection>
    </div>
  );
}

function DictionaryList({
  entries,
  onSelect,
}: {
  entries: DictionaryEntry[];
  onSelect: (id: string) => void;
}) {
  const letters = useMemo(() => {
    const set = new Set(entries.map((e) => e.term[0].toUpperCase()));
    return Array.from(set).sort();
  }, [entries]);

  return (
    <div className="toc-layout">
      <div className="toc-jump">
        {letters.map((l) => (
          <a key={l} href={`#dict-${l}`} className="toc-jump-letter">
            {l}
          </a>
        ))}
      </div>
      <div className="toc-list">
        {entries.map((e, i) => {
          const letter = e.term[0].toUpperCase();
          const isFirstOfLetter = i === 0 || entries[i - 1].term[0].toUpperCase() !== letter;
          return (
            <div key={e.id}>
              {isFirstOfLetter && (
                <div className="toc-letter-heading" id={`dict-${letter}`}>
                  {letter}
                </div>
              )}
              <button className="toc-row" onClick={() => onSelect(e.id)}>
                <span className="toc-row-title">{e.term}</span>
                <span className="toc-row-cite">{e.kind === "maxim" ? "Maxim" : "Term"}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Dictionary() {
  return (
    <Suspense fallback={null}>
      <DictionaryBrowser />
    </Suspense>
  );
}

function DictionaryBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // The entry lives in the URL so global search results and shared links open it directly.
  const activeId = searchParams.get("entry");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");

  function openEntry(id: string) {
    router.push(`${pathname}?entry=${encodeURIComponent(id)}`);
  }

  function closeEntry() {
    router.push(pathname);
  }

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const listQuery = useApiQuery(`dictionary:${debouncedQuery}:${kind}`, () =>
    dictionaryApi.list({
      q: debouncedQuery || undefined,
      kind,
    }),
  );

  if (activeId) {
    return <EntryDetailLoader entryId={activeId} onBack={closeEntry} />;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="label">Law dictionary</p>
          <h2>Legal terms & maxims</h2>
        </div>
      </div>

      <div className="search-bar">
        <div className="search-input-wrap">
          <Search />
          <input
            className="search-input"
            placeholder="Search terms and maxims"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search dictionary"
          />
        </div>
      </div>

      <div className="filters">
        {(["all", "term", "maxim"] as KindFilter[]).map((k) => (
          <button
            key={k}
            className={cn("filter-pill", kind === k && "active")}
            onClick={() => setKind(k)}
          >
            {k === "all" ? "All" : k === "term" ? "Terms" : "Maxims"}
          </button>
        ))}
      </div>

      <AsyncSection
        query={listQuery}
        loadingLabel="Loading dictionary…"
        emptyMessage="No matching entries."
        isEmpty={(entries) => entries.length === 0}
      >
        {(entries) => <DictionaryList entries={entries} onSelect={openEntry} />}
      </AsyncSection>
    </div>
  );
}
