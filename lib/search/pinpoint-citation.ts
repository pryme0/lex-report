import type { CaseIndexItem } from "@/lib/api";

export type PinpointCitation = {
  year: number;
  elrNumber: number;
  courtCode: string;
  /** Absent when the query was a bare citation with no pinpoint page. */
  page: number | null;
  reportCitation: string;
  lookup: string;
};

// Page suffix (", p. 12" / "page 12") is optional so a bare citation like
// "(2025) ELR-000150 (SC)" is recognized too, not just pinpoint cites.
const CITATION_RE =
  /^\s*\((\d{4})\)\s+ELR[-\s](\d+)\s+\(([A-Z]+)\)\s*(?:,?\s*p(?:age)?\.?\s*(\d+))?\s*$/i;

export function parsePinpointCitation(value: string): PinpointCitation | null {
  const match = CITATION_RE.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const elrNumber = Number(match[2]);
  const courtCode = match[3].toUpperCase();
  const pageRaw = match[4];
  const page = pageRaw !== undefined ? Number(pageRaw) : null;
  if (!Number.isSafeInteger(elrNumber) || elrNumber < 1) return null;
  if (page !== null && (!Number.isSafeInteger(page) || page < 1)) return null;

  const lookup = `ELR-${String(elrNumber).padStart(6, "0")}`;
  return {
    year,
    elrNumber,
    courtCode,
    page,
    lookup,
    reportCitation: `(${year}) ${lookup} (${courtCode})`,
  };
}

export function matchingPinpointCase(
  cases: CaseIndexItem[] | null,
  citation: PinpointCitation | null,
): CaseIndexItem | null {
  if (!cases || !citation) return null;
  const expected = citation.reportCitation.toUpperCase();
  return cases.find((item) => item.citation.trim().toUpperCase() === expected) ?? null;
}
