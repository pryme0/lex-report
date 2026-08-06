"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { secondarySourcesApi } from "@/lib/api";
import type { SecondarySource, SecondarySourceDetail, SecondarySourceKind } from "@/lib/api";
import { useApiQuery } from "@/lib/api/hooks";
import { AsyncSection } from "./AsyncState";

type KindFilter = "all" | SecondarySourceKind;

const KIND_LABELS: Record<SecondarySourceKind, string> = {
  "journal-article": "Journal article",
  "textbook-excerpt": "Textbook excerpt",
  commentary: "Commentary",
};

function SourceDetailView({ source }: { source: SecondarySourceDetail }) {
  return (
    <>
      <div className="judgment-header">
        <div>
          <div className="judgment-court-label">{KIND_LABELS[source.kind]}</div>
          <h2 className="judgment-title">{source.title}</h2>
        </div>
      </div>

      <div className="judgment-section" style={{ borderTop: "none", paddingTop: 0 }}>
        <p className="reports-batch-card-meta" style={{ marginBottom: 12 }}>
          {source.author} · {source.publication} · {source.year}
          {source.citation ? ` · ${source.citation}` : ""}
        </p>
        <p>{source.abstract}</p>
        {source.excerpt && (
          <>
            <div className="aside-section-label" style={{ marginTop: 16 }}>
              Excerpt
            </div>
            <p style={{ whiteSpace: "pre-wrap" }}>{source.excerpt}</p>
          </>
        )}
      </div>
    </>
  );
}

function SourceDetailLoader({ sourceId, onBack }: { sourceId: string; onBack: () => void }) {
  const query = useApiQuery(`secondary-sources:${sourceId}`, () =>
    secondarySourcesApi.detail(sourceId),
  );

  return (
    <div className="page">
      <button className="btn btn-link btn-sm" onClick={onBack}>
        <ArrowLeft size={13} /> Back to secondary sources
      </button>
      <AsyncSection query={query} loadingLabel="Loading source…">
        {(source) => <SourceDetailView source={source} />}
      </AsyncSection>
    </div>
  );
}

function SourceList({
  sources,
  onSelect,
}: {
  sources: SecondarySource[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="toc-list">
      {sources.map((s) => (
        <button className="toc-row" key={s.id} onClick={() => onSelect(s.id)}>
          <span className="toc-row-title">{s.title}</span>
          <span className="toc-row-cite">
            {s.author} · {s.year} · {KIND_LABELS[s.kind]}
          </span>
        </button>
      ))}
    </div>
  );
}

export function SecondarySources() {
  return (
    <Suspense fallback={null}>
      <SecondarySourcesBrowser />
    </Suspense>
  );
}

function SecondarySourcesBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("source");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");

  function openSource(id: string) {
    router.push(`${pathname}?source=${encodeURIComponent(id)}`);
  }

  function closeSource() {
    router.push(pathname);
  }

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const listQuery = useApiQuery(`secondary-sources:${debouncedQuery}:${kind}`, () =>
    secondarySourcesApi.list({ q: debouncedQuery || undefined, kind }),
  );

  if (activeId) {
    return <SourceDetailLoader sourceId={activeId} onBack={closeSource} />;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="label">Secondary literature</p>
          <h2>Journals & commentary</h2>
        </div>
      </div>

      <div className="search-bar">
        <div className="search-input-wrap">
          <Search />
          <input
            className="search-input"
            placeholder="Search journal articles, textbook excerpts, commentary"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search secondary sources"
          />
        </div>
      </div>

      <div className="filters">
        {(["all", "journal-article", "textbook-excerpt", "commentary"] as KindFilter[]).map(
          (k) => (
            <button
              key={k}
              className={cn("filter-pill", kind === k && "active")}
              onClick={() => setKind(k)}
            >
              {k === "all" ? "All" : KIND_LABELS[k]}
            </button>
          ),
        )}
      </div>

      <AsyncSection
        query={listQuery}
        loadingLabel="Loading secondary sources…"
        emptyMessage="No matching sources."
        isEmpty={(sources) => sources.length === 0}
      >
        {(sources) => <SourceList sources={sources} onSelect={openSource} />}
      </AsyncSection>
    </div>
  );
}
