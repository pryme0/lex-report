"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

type PageToken = number | `ellipsis-${"left" | "right"}`;

function pageTokens(currentPage: number, totalPages: number): PageToken[] {
  const pages = new Set<number>([
    1,
    2,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    totalPages - 1,
    totalPages,
  ]);
  const ordered = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
  const tokens: PageToken[] = [];

  ordered.forEach((page, index) => {
    const previous = ordered[index - 1];
    if (previous && page - previous > 1) {
      tokens.push(previous < currentPage ? "ellipsis-left" : "ellipsis-right");
    }
    tokens.push(page);
  });
  return tokens;
}

type SearchPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
};

export function SearchPagination({ page, totalPages, total, limit, onPageChange }: SearchPaginationProps) {
  const [jumpValue, setJumpValue] = useState(String(page));
  const tokens = useMemo(() => pageTokens(page, totalPages), [page, totalPages]);
  const firstResult = (page - 1) * limit + 1;
  const lastResult = Math.min(page * limit, total);

  useEffect(() => setJumpValue(String(page)), [page]);

  const goTo = (nextPage: number) => {
    const bounded = Math.min(totalPages, Math.max(1, Math.trunc(nextPage)));
    if (bounded !== page) onPageChange(bounded);
  };

  const submitJump = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const requested = Number(jumpValue);
    if (!Number.isFinite(requested)) {
      setJumpValue(String(page));
      return;
    }
    const bounded = Math.min(totalPages, Math.max(1, Math.trunc(requested)));
    setJumpValue(String(bounded));
    goTo(bounded);
  };

  return (
    <nav className="search-pagination" aria-label="Search result pages">
      <div className="search-pagination-meta" aria-live="polite">
        <span>Showing <strong>{firstResult.toLocaleString()}–{lastResult.toLocaleString()}</strong></span>
        <span>of {total.toLocaleString()} judgments</span>
      </div>

      <div className="search-pagination-navigation">
        <div className="search-pagination-controls">
          <button type="button" className="search-page-btn search-page-edge" disabled={page <= 1} onClick={() => goTo(1)} aria-label="First page" title="First page">
            <ChevronsLeft size={15} aria-hidden="true" />
          </button>
          <button type="button" className="search-page-btn search-page-edge" disabled={page <= 1} onClick={() => goTo(page - 1)} aria-label="Previous page" title="Previous page">
            <ChevronLeft size={15} aria-hidden="true" />
          </button>

          <div className="search-pagination-pages">
            {tokens.map((token) => typeof token === "number" ? (
              <button
                type="button"
                key={token}
                className={cn("search-page-btn", token === page && "is-active")}
                onClick={() => goTo(token)}
                aria-current={token === page ? "page" : undefined}
                aria-label={`Page ${token.toLocaleString()}`}
              >
                {token.toLocaleString()}
              </button>
            ) : (
              <span className="search-page-ellipsis" aria-hidden="true" key={token}>…</span>
            ))}
          </div>

          <button type="button" className="search-page-btn search-page-edge" disabled={page >= totalPages} onClick={() => goTo(page + 1)} aria-label="Next page" title="Next page">
            <ChevronRight size={15} aria-hidden="true" />
          </button>
          <button type="button" className="search-page-btn search-page-edge" disabled={page >= totalPages} onClick={() => goTo(totalPages)} aria-label="Last page" title="Last page">
            <ChevronsRight size={15} aria-hidden="true" />
          </button>
        </div>

        <form className="search-pagination-jump" onSubmit={submitJump}>
          <label htmlFor="search-page-jump">Go to</label>
          <input
            id="search-page-jump"
            type="number"
            min={1}
            max={totalPages}
            value={jumpValue}
            onChange={(event) => setJumpValue(event.target.value)}
            inputMode="numeric"
            aria-label={`Go to page, 1 to ${totalPages.toLocaleString()}`}
          />
          <button type="submit">Go</button>
        </form>
      </div>

      <span className="search-pagination-summary">Page {page.toLocaleString()} of {totalPages.toLocaleString()}</span>
    </nav>
  );
}
