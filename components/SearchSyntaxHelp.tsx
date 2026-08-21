"use client";

import { useRef, useState } from "react";
import { CircleHelp } from "lucide-react";
import { useDismissable } from "@/lib/useDismissable";
import { cn } from "@/lib/utils";

const FIELD_PREFIXES = [
  "title",
  "judge / judges",
  "counsel",
  "party / parties",
  "citation",
  "area",
  "ratio",
  "holding",
  "facts",
  "text / fulltext",
] as const;

export function SearchSyntaxHelp() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useDismissable<HTMLDivElement>(open, () => setOpen(false), triggerRef);

  return (
    <div className="search-syntax-wrap" ref={panelRef}>
      <button
        ref={triggerRef}
        type="button"
        className={cn("search-syntax-trigger", open && "active")}
        aria-expanded={open}
        aria-controls="search-syntax-panel"
        onClick={() => setOpen((o) => !o)}
      >
        <CircleHelp size={14} />
        <span>Query syntax</span>
      </button>
      {open && (
        <div className="search-syntax-panel" id="search-syntax-panel" role="dialog" aria-label="Search query syntax">
          <p className="search-syntax-lead">
            Terms are combined with <strong>AND</strong> by default. Use operators and field prefixes to narrow a search.
          </p>
          <p className="search-syntax-lead">
            Or just ask in plain English — <em>&quot;breach of contract cases from the Supreme Court in 2023&quot;</em> —
            and AI will work out the filters for you. Anything using the syntax below runs as a normal keyword search instead.
          </p>
          <dl className="search-syntax-list">
            <div>
              <dt>Quoted phrases</dt>
              <dd>
                <code>&quot;natural justice&quot;</code> — exact phrase
              </dd>
            </div>
            <div>
              <dt>Boolean operators</dt>
              <dd>
                <code>AND</code>, <code>OR</code>, <code>NOT</code> — e.g.{" "}
                <code>floating AND charge OR lien</code>
              </dd>
            </div>
            <div>
              <dt>Exclude a term</dt>
              <dd>
                <code>-overruled</code> or <code>NOT overruled</code>
              </dd>
            </div>
            <div>
              <dt>Field prefixes</dt>
              <dd>
                <code>ratio:natural justice</code>, <code>judge:Nnamani</code>,{" "}
                <code>counsel:Falana</code>
              </dd>
              <dd className="search-syntax-sub">
                Supported fields: {FIELD_PREFIXES.join(", ")}.
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
