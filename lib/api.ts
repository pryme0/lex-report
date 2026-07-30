import type {
  CaseItem,
  CitedCase,
  CitedStatute,
  CitingCase,
  DictionaryEntry,
  DirectHistoryEntry,
  Statute,
  Treatment,
  AppealOutcome,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`API request failed: ${path} (${res.status})`);
  }
  return res.json() as Promise<T>;
}

// ─── Enum adapters — backend uses UPPER_SNAKE, frontend uses Title Case ──────

const TREATMENT_MAP: Record<string, Treatment> = {
  FOLLOWED: "Followed",
  DISTINGUISHED: "Distinguished",
  OVERRULED: "Overruled",
  QUESTIONED: "Questioned",
};

const OUTCOME_MAP: Record<string, AppealOutcome> = {
  AFFIRMED: "Affirmed",
  REVERSED: "Reversed",
  REMITTED: "Remitted",
};

function toTreatment(value: string): Treatment {
  return TREATMENT_MAP[value] ?? "Followed";
}

function toOutcome(value: string): AppealOutcome {
  return OUTCOME_MAP[value] ?? "Affirmed";
}

// ─── Backend response shapes ────────────────────────────────────────────────

interface ApiCaseSummary {
  id: string;
  code: string;
  title: string;
  citation: string;
  court: string;
  year: number;
  area: string;
  posture: string;
  ratio: string;
  treatment: string;
  strength: number;
  readTimeMins: number;
}

interface ApiCaseDetail extends ApiCaseSummary {
  facts: string;
  holding: string;
  judges: { name: string; title: string | null }[];
  issues: string[];
  citedCases: { title: string; caseCode: string | null }[];
  citedStatutes: { title: string; section: string | null; statuteId: string | null }[];
}

interface ApiCitator {
  standing: "GOOD_LAW" | "CAUTIONARY" | "BAD_LAW";
  directHistory: { court: string; outcome: string; citation: string; year: number }[];
  citingCases: { title: string; citation: string; year: number; treatment: string; caseCode: string | null }[];
}

interface ApiDigestNode {
  id: string;
  name: string;
  cases: ApiCaseSummary[];
}

interface ApiDigestTop extends ApiDigestNode {
  children: ApiDigestNode[];
}

interface ApiStatuteSummary {
  id: string;
  title: string;
  shortTitle: string;
  year: number;
  sectionCount: number;
}

interface ApiStatuteDetail {
  id: string;
  title: string;
  shortTitle: string;
  year: number;
  sections: {
    number: string;
    heading: string;
    text: string;
    interpretingCases: { caseCode: string; caseTitle: string }[];
  }[];
}

interface ApiTableOfStatutesEntry {
  title: string;
  cases: { caseCode: string; caseTitle: string; section: string | null }[];
}

interface ApiDictionaryEntrySummary {
  id: string;
  term: string;
  kind: "TERM" | "MAXIM";
  definition: string;
}

interface ApiDictionaryEntryDetail extends ApiDictionaryEntrySummary {
  appliedIn: { caseCode: string; caseTitle: string }[];
}

// ─── Case adapters ───────────────────────────────────────────────────────────

function toCaseItem(summary: ApiCaseSummary): CaseItem {
  return {
    id: summary.code,
    title: summary.title,
    citation: summary.citation,
    court: summary.court,
    year: summary.year,
    judges: "", // not present on the summary shape — only fetched on case detail
    area: summary.area,
    posture: summary.posture,
    ratio: summary.ratio,
    treatment: toTreatment(summary.treatment),
    strength: summary.strength,
    readTime: `${summary.readTimeMins} min`,
  };
}

function toCitedCase(c: { title: string; caseCode: string | null }): CitedCase {
  return { title: c.title, caseId: c.caseCode ?? undefined };
}

function toCitedStatute(s: { title: string; section: string | null }): CitedStatute {
  return { title: s.title, section: s.section ?? undefined };
}

function toDirectHistoryEntry(h: { court: string; outcome: string; citation: string; year: number }): DirectHistoryEntry {
  return { court: h.court, outcome: toOutcome(h.outcome), citation: h.citation, year: h.year };
}

function toCitingCase(c: { title: string; citation: string; year: number; treatment: string; caseCode: string | null }): CitingCase {
  return {
    caseId: c.caseCode ?? undefined,
    title: c.title,
    citation: c.citation,
    treatment: toTreatment(c.treatment),
    year: c.year,
  };
}

function joinJudges(judges: { name: string; title: string | null }[]): string {
  return judges.map((j) => (j.title ? `${j.name} ${j.title}` : j.name)).join("; ");
}

export async function fetchCases(): Promise<CaseItem[]> {
  const res = await apiFetch<{ items: ApiCaseSummary[] }>("/cases");
  return res.items.map(toCaseItem);
}

// Merges GET /cases/:code and GET /cases/:code/citator into one fully-populated
// CaseItem — JudgmentDetail and CaseCitator both read from the result.
export async function fetchCaseDetail(code: string): Promise<CaseItem> {
  const [detail, citator] = await Promise.all([
    apiFetch<ApiCaseDetail>(`/cases/${code}`),
    apiFetch<ApiCitator>(`/cases/${code}/citator`),
  ]);

  return {
    ...toCaseItem(detail),
    judges: joinJudges(detail.judges),
    facts: detail.facts,
    holding: detail.holding,
    issues: detail.issues,
    citedCases: detail.citedCases.map(toCitedCase),
    citedStatutes: detail.citedStatutes.map(toCitedStatute),
    directHistory: citator.directHistory.map(toDirectHistoryEntry),
    citingCases: citator.citingCases.map(toCitingCase),
  };
}

// ─── Digest adapters ─────────────────────────────────────────────────────────

export interface DigestCategoryNode {
  id: string;
  name: string;
  cases: CaseItem[];
  children: { id: string; name: string; cases: CaseItem[] }[];
}

export async function fetchDigestTree(): Promise<DigestCategoryNode[]> {
  const tree = await apiFetch<ApiDigestTop[]>("/digest");
  return tree.map((top) => ({
    id: top.id,
    name: top.name,
    cases: top.cases.map(toCaseItem),
    children: top.children.map((child) => ({
      id: child.id,
      name: child.name,
      cases: child.cases.map(toCaseItem),
    })),
  }));
}

export async function fetchTableOfCases(): Promise<CaseItem[]> {
  const cases = await apiFetch<ApiCaseSummary[]>("/digest/table-of-cases");
  return cases.map(toCaseItem);
}

export interface TableOfStatutesEntry {
  title: string;
  cases: { caseCode: string; caseTitle: string; section: string | null }[];
}

export async function fetchTableOfStatutes(): Promise<TableOfStatutesEntry[]> {
  return apiFetch<ApiTableOfStatutesEntry[]>("/digest/table-of-statutes");
}

// ─── Legislation adapters ────────────────────────────────────────────────────

export interface StatuteSummary {
  id: string;
  title: string;
  shortTitle: string;
  year: number;
  sectionCount: number;
}

export async function fetchStatutes(): Promise<StatuteSummary[]> {
  return apiFetch<ApiStatuteSummary[]>("/statutes");
}

export async function fetchStatute(id: string): Promise<Statute> {
  const s = await apiFetch<ApiStatuteDetail>(`/statutes/${id}`);
  return {
    id: s.id,
    title: s.title,
    shortTitle: s.shortTitle,
    year: s.year,
    sections: s.sections,
  };
}

// ─── Dictionary adapters ─────────────────────────────────────────────────────

// A minimal CaseItem placeholder keyed by code — JudgmentDetail re-fetches the
// full record by `id` (the case code) on open, so these fields never render.
// Used wherever a list only has {caseCode, caseTitle} rather than a full case.
export function placeholderCase(code: string, title: string): CaseItem {
  return {
    id: code,
    title,
    citation: "",
    court: "",
    year: 0,
    judges: "",
    area: "",
    posture: "",
    ratio: "",
    treatment: "Followed",
    strength: 0,
    readTime: "",
  };
}

function toDictionaryKind(kind: "TERM" | "MAXIM"): "term" | "maxim" {
  return kind === "MAXIM" ? "maxim" : "term";
}

export async function fetchDictionaryEntries(query: { search?: string; kind?: "term" | "maxim" }): Promise<
  Omit<DictionaryEntry, "appliedIn">[]
> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.kind) params.set("kind", query.kind.toUpperCase());
  const qs = params.toString();

  const entries = await apiFetch<ApiDictionaryEntrySummary[]>(`/dictionary${qs ? `?${qs}` : ""}`);
  return entries.map((e) => ({ id: e.id, term: e.term, kind: toDictionaryKind(e.kind), definition: e.definition }));
}

export interface DictionaryEntryDetail {
  id: string;
  term: string;
  kind: "term" | "maxim";
  definition: string;
  appliedIn: { caseCode: string; caseTitle: string }[];
}

export async function fetchDictionaryEntry(id: string): Promise<DictionaryEntryDetail> {
  const e = await apiFetch<ApiDictionaryEntryDetail>(`/dictionary/${id}`);
  return { id: e.id, term: e.term, kind: toDictionaryKind(e.kind), definition: e.definition, appliedIn: e.appliedIn };
}
