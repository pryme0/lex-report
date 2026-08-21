"use client";

import { Filter, ChevronDown, X } from "lucide-react";
import type { ArchiveFilters } from "@/lib/api";
import type { ResearchFilterState } from "@/lib/search/url-state";
import { cn } from "@/lib/utils";

type FacetKey = keyof Pick<
  ResearchFilterState,
  "court" | "area" | "digestArea" | "jurisdiction" | "treatment" | "reportSeries"
>;

const FACET_LABELS: Record<FacetKey, string> = {
  court: "Court",
  area: "Practice area",
  digestArea: "Digest area",
  jurisdiction: "Jurisdiction",
  treatment: "Treatment",
  reportSeries: "Report series",
};

const TOGGLE_FILTERS = [
  { key: "ratioOnly" as const, label: "Ratio only" },
  { key: "positiveTreatment" as const, label: "Positive treatment" },
  { key: "verified" as const, label: "Verified" },
] as const;

interface ResearchFiltersProps {
  archive: ArchiveFilters | null;
  filters: ResearchFilterState;
  onChange: (next: ResearchFilterState) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}

// "Unclassified" means an editor hasn't categorised the case yet — it's the absence of a
// value, not a real practice area a researcher would filter to, so it's excluded here the same
// way a blank value is. Filtering *to* "everything not yet classified" isn't a useful facet.
const PLACEHOLDER_FACET_VALUES = new Set(["", "Unclassified"]);

function facetValues(archive: ArchiveFilters, key: FacetKey) {
  const raw = (() => {
    switch (key) {
      case "court":
        return archive.courts;
      case "area":
        return archive.practiceAreas;
      case "digestArea":
        return archive.digestAreas;
      case "jurisdiction":
        return archive.jurisdictions;
      case "treatment":
        return archive.treatments;
      case "reportSeries":
        return archive.reportSeries;
    }
  })();
  return raw.filter(({ value }) => !PLACEHOLDER_FACET_VALUES.has(value.trim()));
}

function activeFacetCount(filters: ResearchFilterState): number {
  let count = 0;
  if (filters.court) count += 1;
  if (filters.area) count += 1;
  if (filters.digestArea) count += 1;
  if (filters.jurisdiction) count += 1;
  if (filters.treatment) count += 1;
  if (filters.reportSeries) count += 1;
  if (filters.year != null || filters.yearFrom != null || filters.yearTo != null) count += 1;
  if (filters.month != null) count += 1;
  if (filters.ratioOnly) count += 1;
  if (filters.positiveTreatment) count += 1;
  if (filters.verified) count += 1;
  return count;
}

export function ResearchFilters({
  archive,
  filters,
  onChange,
  expanded,
  onToggleExpanded,
}: ResearchFiltersProps) {
  const activeCount = activeFacetCount(filters);

  const setFacet = (key: FacetKey, value: string) => {
    const current = filters[key];
    onChange({ ...filters, [key]: current === value ? undefined : value });
  };

  const setYear = (year: number | undefined) => {
    onChange({
      ...filters,
      year,
      yearFrom: undefined,
      yearTo: undefined,
    });
  };

  const setYearRange = (from: number | undefined, to: number | undefined) => {
    onChange({
      ...filters,
      year: undefined,
      yearFrom: from,
      yearTo: to,
    });
  };

  const setMonth = (month: number | undefined) => {
    onChange({ ...filters, month });
  };

  const clearAll = () => {
    onChange({});
  };

  if (!archive) {
    return (
      <div className="research-filters">
        <Filter size={12} className="research-filters-icon" />
        <span className="research-filters-loading">Loading filters…</span>
      </div>
    );
  }

  const yearOptions = archive.years.counts.map(({ year }) => year).sort((a, b) => b - a);

  const facetKeys = (Object.keys(FACET_LABELS) as FacetKey[]).filter(
    (key) => facetValues(archive, key).length > 0,
  );

  return (
    <div className="research-filters">
      <div className="research-filters-bar">
        <Filter size={12} className="research-filters-icon" />
        <button
          type="button"
          className={cn("research-filters-toggle", expanded && "active")}
          aria-expanded={expanded}
          onClick={onToggleExpanded}
        >
          Filters
          {activeCount > 0 && <span className="research-filters-badge">{activeCount}</span>}
          <ChevronDown size={12} className={cn("research-filters-chevron", expanded && "open")} />
        </button>
        {activeCount > 0 && (
          <button type="button" className="research-filters-clear" onClick={clearAll}>
            <X size={11} /> Clear all
          </button>
        )}
        <div className="research-filters-quick">
          {TOGGLE_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={cn("filter-pill", filters[key] && "active")}
              aria-pressed={Boolean(filters[key])}
              onClick={() => onChange({ ...filters, [key]: filters[key] ? undefined : true })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {expanded && (
        <div className="research-filters-panel">
          {archive.years.counts.length > 0 && (
            <section className="research-filter-group">
              <h4 className="research-filter-heading">Year</h4>
              {yearOptions.length > 1 && (
                <div className="research-year-range">
                  <select
                    className="search-sort-select"
                    value={filters.yearFrom ?? ""}
                    aria-label="Year from"
                    onChange={(e) => {
                      const from = e.target.value ? Number(e.target.value) : undefined;
                      setYearRange(from, filters.yearTo);
                    }}
                  >
                    <option value="">From</option>
                    {yearOptions.map((year) => (
                      <option key={`from-${year}`} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <select
                    className="search-sort-select"
                    value={filters.yearTo ?? ""}
                    aria-label="Year to"
                    onChange={(e) => {
                      const to = e.target.value ? Number(e.target.value) : undefined;
                      setYearRange(filters.yearFrom, to);
                    }}
                  >
                    <option value="">To</option>
                    {yearOptions.map((year) => (
                      <option key={`to-${year}`} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {archive.months.some((m) => m.count > 0) && (
                <div className="research-month-filter">
                  <select
                    className="search-sort-select"
                    value={filters.month ?? ""}
                    aria-label="Month"
                    onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : undefined)}
                  >
                    <option value="">Any month</option>
                    {archive.months.map(({ value, label, count }) => (
                      <option key={value} value={value} disabled={count === 0}>
                        {label} ({count})
                      </option>
                    ))}
                  </select>
                  <p className="research-filter-caption">
                    Based on captured decision dates — coverage is partial.
                  </p>
                </div>
              )}
              <div className="research-filter-pills">
                {archive.years.counts.map(({ year, count }) => (
                  <button
                    key={year}
                    type="button"
                    className={cn("filter-pill", filters.year === year && "active")}
                    aria-pressed={filters.year === year}
                    onClick={() => setYear(filters.year === year ? undefined : year)}
                  >
                    {year}
                    <span className="filter-count">{count}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {facetKeys.map((key) => {
            const values = facetValues(archive, key);
            return (
              <section className="research-filter-group" key={key}>
                <h4 className="research-filter-heading">{FACET_LABELS[key]}</h4>
                <div className="research-filter-pills">
                  {values.map(({ value, count }) => (
                    <button
                      key={value}
                      type="button"
                      className={cn("filter-pill", filters[key] === value && "active")}
                      aria-pressed={filters[key] === value}
                      onClick={() => setFacet(key, value)}
                      title={value}
                    >
                      <span className="filter-pill-label">{value}</span>
                      <span className="filter-count">{count}</span>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
