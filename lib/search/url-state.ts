import type { CaseSearchParams, CaseSort } from "@/lib/api";

export type ResearchFilterState = Pick<
  CaseSearchParams,
  | "court"
  | "year"
  | "yearFrom"
  | "yearTo"
  | "month"
  | "area"
  | "digestArea"
  | "jurisdiction"
  | "treatment"
  | "reportSeries"
  | "ratioOnly"
  | "positiveTreatment"
  | "verified"
>;

export type ResearchUrlState = ResearchFilterState & {
  q: string;
  sort: CaseSort;
  page: number;
};

const SORTS: CaseSort[] = ["relevance", "strength", "recent", "year", "title", "cited"];

const truthy = (value: string | null) => value === "1" || value === "true";

const parseIntParam = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
};

export function parseResearchUrl(params: URLSearchParams): ResearchUrlState {
  const sortParam = params.get("sort");
  const sort = SORTS.includes(sortParam as CaseSort) ? (sortParam as CaseSort) : "relevance";

  return {
    q: params.get("q") ?? "",
    court: params.get("court") ?? undefined,
    year: parseIntParam(params.get("year")),
    yearFrom: parseIntParam(params.get("yearFrom")),
    yearTo: parseIntParam(params.get("yearTo")),
    month: parseIntParam(params.get("month")),
    area: params.get("area") ?? undefined,
    digestArea: params.get("digestArea") ?? undefined,
    jurisdiction: params.get("jurisdiction") ?? undefined,
    treatment: params.get("treatment") ?? undefined,
    reportSeries: params.get("reportSeries") ?? undefined,
    ratioOnly: truthy(params.get("ratioOnly")) ? true : undefined,
    positiveTreatment: truthy(params.get("positiveTreatment")) ? true : undefined,
    verified: truthy(params.get("verified")) ? true : undefined,
    sort,
    page: Math.max(1, parseIntParam(params.get("page")) ?? 1),
  };
}

export function serializeResearchUrl(state: ResearchUrlState): string {
  const params = new URLSearchParams();

  if (state.q) params.set("q", state.q);
  if (state.court) params.set("court", state.court);
  if (state.year != null) params.set("year", String(state.year));
  if (state.yearFrom != null) params.set("yearFrom", String(state.yearFrom));
  if (state.yearTo != null) params.set("yearTo", String(state.yearTo));
  if (state.month != null) params.set("month", String(state.month));
  if (state.area) params.set("area", state.area);
  if (state.digestArea) params.set("digestArea", state.digestArea);
  if (state.jurisdiction) params.set("jurisdiction", state.jurisdiction);
  if (state.treatment) params.set("treatment", state.treatment);
  if (state.reportSeries) params.set("reportSeries", state.reportSeries);
  if (state.ratioOnly) params.set("ratioOnly", "1");
  if (state.positiveTreatment) params.set("positiveTreatment", "1");
  if (state.verified) params.set("verified", "1");
  if (state.sort !== "relevance") params.set("sort", state.sort);
  if (state.page > 1) params.set("page", String(state.page));

  return params.toString();
}

export function researchFiltersFromState(
  state: ResearchUrlState,
): ResearchFilterState {
  return {
    court: state.court,
    year: state.year,
    yearFrom: state.yearFrom,
    yearTo: state.yearTo,
    month: state.month,
    area: state.area,
    digestArea: state.digestArea,
    jurisdiction: state.jurisdiction,
    treatment: state.treatment,
    reportSeries: state.reportSeries,
    ratioOnly: state.ratioOnly,
    positiveTreatment: state.positiveTreatment,
    verified: state.verified,
  };
}
