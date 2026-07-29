"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/contexts/DashboardContext";
import { cases } from "@/lib/data";
import { dictionaryEntries } from "@/lib/dictionary-data";
import type { DictionaryEntry } from "@/lib/types";

type KindFilter = "all" | "term" | "maxim";

function EntryDetail({ entry, onBack }: { entry: DictionaryEntry; onBack: () => void }) {
  const { setSelectedCase } = useDashboard();
  const appliedCases = cases.filter(c => entry.appliedIn.includes(c.id));

  return (
    <div className="page">
      <button className="btn btn-link btn-sm" onClick={onBack}>
        <ArrowLeft size={13} /> Back to dictionary
      </button>

      <div className="judgment-header">
        <div>
          <div className="judgment-court-label">{entry.kind === "maxim" ? "Legal maxim" : "Legal term"}</div>
          <h2 className="judgment-title">{entry.term}</h2>
        </div>
      </div>

      <div className="judgment-section" style={{ borderTop: "none", paddingTop: 0 }}>
        <p>{entry.definition}</p>
      </div>

      <div className="aside-section-label" style={{ marginTop: 0 }}>Applied in</div>
      {appliedCases.length === 0 ? (
        <p className="citator-empty">No judgment in this archive has applied this {entry.kind} yet.</p>
      ) : (
        <div className="authority-links">
          {appliedCases.map(c => (
            <button className="authority-link-btn" key={c.id} onClick={() => setSelectedCase(c)}>
              {c.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Dictionary() {
  const [active, setActive] = useState<DictionaryEntry | null>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");

  const filtered = useMemo(() => {
    return dictionaryEntries
      .filter(e => kind === "all" || e.kind === kind)
      .filter(e => e.term.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [query, kind]);

  const letters = useMemo(() => {
    const set = new Set(filtered.map(e => e.term[0].toUpperCase()));
    return Array.from(set).sort();
  }, [filtered]);

  if (active) return <EntryDetail entry={active} onBack={() => setActive(null)} />;

  return (
    <div className="page">
      <div className="page-header">
        <div><p className="label">Law dictionary</p><h2>Legal terms & maxims</h2></div>
      </div>

      <div className="search-bar">
        <div className="search-input-wrap">
          <Search />
          <input
            className="search-input"
            placeholder="Search terms and maxims"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Search dictionary"
          />
        </div>
      </div>

      <div className="filters">
        {(["all", "term", "maxim"] as KindFilter[]).map(k => (
          <button
            key={k}
            className={cn("filter-pill", kind === k && "active")}
            onClick={() => setKind(k)}
          >
            {k === "all" ? "All" : k === "term" ? "Terms" : "Maxims"}
          </button>
        ))}
      </div>

      <div className="toc-layout">
        <div className="toc-jump">
          {letters.map(l => (
            <a key={l} href={`#dict-${l}`} className="toc-jump-letter">{l}</a>
          ))}
        </div>
        <div className="toc-list">
          {filtered.map((e, i) => {
            const letter = e.term[0].toUpperCase();
            const isFirstOfLetter = i === 0 || filtered[i - 1].term[0].toUpperCase() !== letter;
            return (
              <div key={e.id}>
                {isFirstOfLetter && <div className="toc-letter-heading" id={`dict-${letter}`}>{letter}</div>}
                <button className="toc-row" onClick={() => setActive(e)}>
                  <span className="toc-row-title">{e.term}</span>
                  <span className="toc-row-cite">{e.kind === "maxim" ? "Maxim" : "Term"}</span>
                </button>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="citator-empty" style={{ padding: 16 }}>No matching entries.</p>}
        </div>
      </div>
    </div>
  );
}
