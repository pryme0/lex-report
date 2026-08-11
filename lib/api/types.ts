import type { Standing, Treatment } from "@/lib/types";

export type Paginated<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type CaseSummary = {
  id: string;
  title: string;
  citation: string;
  editorialCitation?: string;
  sourceCitation?: string | null;
  court: string;
  year: number;
  judges: string;
  area: string;
  digestArea: string;
  posture: string;
  ratio: string;
  treatment: Treatment;
  strength: number;
  readTime: string;
  facts: string;
  holding: string;
  verified: boolean;
  /** "Federal", or the state whose law governs. */
  jurisdiction: string;
  documentType?: "judgment" | "ruling" | "order" | "decision" | string;
  sourcePageCount?: number;
  /** Court-assigned citation, independent of any law reporter. */
  neutralCitation?: string | null;
  /** Unique LexReport series placement assigned to this judgment. */
  report?: ReportPlacement | null;
  /** Matched passage with `<b>` marks, present only on relevance-ranked search hits. */
  snippet?: string;
};

export type SourcePage = {
  number: number;
  text: string;
  extraction: "text" | "ocr";
  citation: string;
};

export type Counsel = {
  name: string;
  side: "appellant" | "respondent" | "applicant" | "amicus";
  rank?: string | null;
  lead: boolean;
};

/** Where the judgment sits in a law report series. Absent when unreported. */
export type ReportPlacement = {
  series: string;
  volume?: number | null;
  part?: number | null;
  page?: number | null;
  /** Composed for display and copying, e.g. "(2026) ELR-000001 (SC)". */
  seriesCitation: string;
};

export type CitedCaseRef = { title: string; caseId?: string };
/** `statuteId` is set only when the statute is held in the legislation library. */
export type CitedStatuteRef = { title: string; section?: string; statuteId?: string };

export type DirectHistoryEntry = {
  court: string;
  outcome: string;
  citation: string;
  year: number;
};

export type CitingCase = {
  caseId?: string;
  title: string;
  citation: string;
  treatment: Treatment;
  year: number;
  court?: string;
};

/** A negative treatment on record that did not move the standing, and the reason it did not. */
export type StandingNote = {
  title: string;
  citation: string;
  treatment: Treatment;
  court?: string;
  reason: string;
};

export type CaseDetail = CaseSummary & {
  /** The judgment as delivered — the text a practitioner actually cites from. */
  fullText: string;
  suitNo?: string | null;
  appealNo?: string | null;
  sourcePages?: SourcePage[];
  appellant?: string | null;
  respondent?: string | null;
  counsel: Counsel[];
  issues: string[];
  citedCases: CitedCaseRef[];
  citedStatutes: CitedStatuteRef[];
  directHistory: DirectHistoryEntry[];
  citingCases: CitingCase[];
  standing: Standing;
  standingBasis: string;
  standingNotes: StandingNote[];
  reviewedAt: string;
};

export type CaseIndexItem = { id: string; title: string; citation: string };

export type Citator = {
  standing: Standing;
  standingBasis: string;
  standingNotes: StandingNote[];
  reviewedAt: string;
  directHistory: DirectHistoryEntry[];
  citingCases: CitingCase[];
  citingCount: number;
};

export type CaseNode = {
  id: string;
  shortTitle: string;
  title: string;
  citation: string;
  court: string;
  year: number;
  treatment: Treatment;
  direction: "center" | "citing" | "cited";
  context: string;
};

export type TimelineEvent = {
  id: string;
  date: string;
  year: number;
  caseTitle: string;
  citation: string;
  court: string;
  treatment: Treatment;
  note: string;
};

export type CitationGraph = {
  center: CaseNode;
  citing: CaseNode[];
  cited: CaseNode[];
  timeline: TimelineEvent[];
  summary: {
    citingCount: number;
    followedCiting: number;
    citedCount: number;
    followedCited: number;
  };
};

export type CaseSort =
  | "relevance"
  | "strength"
  | "recent"
  | "year"
  | "title"
  | "cited";

export type CaseSearchParams = {
  q?: string;
  /** Exact court name. Comma-separate to match any of several. */
  court?: string;
  year?: number;
  yearFrom?: number;
  yearTo?: number;
  area?: string;
  digestArea?: string;
  jurisdiction?: string;
  treatment?: string;
  /** Matches any counsel on the record, so "find every case X appeared in" works. */
  counsel?: string;
  reportSeries?: string;
  ratioOnly?: boolean;
  positiveTreatment?: boolean;
  verified?: boolean;
  sort?: CaseSort;
  page?: number;
  limit?: number;
};

/** A facet value present in the archive, with how many judgments carry it. */
export type FacetCount = { value: string; count: number };

/** Filter options derived from the archive rather than hardcoded in the UI. */
export type ArchiveFilters = {
  courts: FacetCount[];
  years: {
    min: number | null;
    max: number | null;
    counts: { year: number; count: number }[];
  };
  practiceAreas: FacetCount[];
  digestAreas: FacetCount[];
  jurisdictions: FacetCount[];
  reportSeries: FacetCount[];
  treatments: FacetCount[];
};

export type GlobalSearchKind =
  | "case"
  | "statute"
  | "section"
  | "dictionary"
  | "instrument"
  | "provision"
  | "form";

export type GlobalSearchHit = {
  kind: GlobalSearchKind;
  refId: string;
  /** The parent record, e.g. the statute a section belongs to. */
  parentId?: string;
  title: string;
  subtitle?: string;
  snippet?: string;
};

export type GlobalSearchResult = {
  groups: { kind: GlobalSearchKind; hits: GlobalSearchHit[] }[];
};

export type AuthorityMapNode = {
  id: string;
  label: string;
  court: string;
  year: number;
  strength: number;
};

export type AuthorityMap = {
  nodes: AuthorityMapNode[];
  pathNote: string;
};

export type DigestCase = {
  id: string;
  title: string;
  citation: string;
  court: string;
  year: number;
  treatment: Treatment;
  digestArea: string;
};

export type DigestSubjectArea = {
  area: string;
  subAreas: { name: string; cases: DigestCase[] }[];
};

export type DigestStatuteEntry = {
  title: string;
  cases: { caseId: string; title: string; section?: string }[];
};

/** Fields shared by the statute list and detail views. */
export type StatuteMeta = {
  id: string;
  title: string;
  shortTitle: string;
  year: number;
  longTitle: string;
  /** "Federal", or the state that enacted it. */
  jurisdiction: string;
  chapter?: string | null;
  commencement?: string | null;
  repealed: boolean;
  repealedBy?: string | null;
  /** False once repealed — the one-glance answer to "is this still the law?". */
  inForce: boolean;
};

export type StatuteListItem = StatuteMeta & { sectionCount: number };

export type StatuteSection = {
  /** Stable handle for deep links and editorial updates. */
  id: string;
  number: string;
  heading: string;
  text: string;
  repealed: boolean;
  amendmentNote?: string | null;
  inForce: boolean;
};

export type StatuteAmendment = {
  id: string;
  year: number;
  /** The amending Act or instrument. */
  instrument: string;
  description: string;
  sectionNumbers: string[];
  effectiveDate?: string | null;
};

export type StatuteDetail = StatuteMeta & {
  sections: StatuteSection[];
  amendments: StatuteAmendment[];
};

export type PracticeInstrumentKind = "rules" | "practice-direction";

export type PracticeInstrument = {
  id: string;
  title: string;
  shortTitle: string;
  kind: PracticeInstrumentKind;
  court: string;
  jurisdiction: string;
  year: number;
  description: string;
  provisionCount: number;
};

export type PracticeProvision = {
  id: string;
  /** e.g. "Order 3 Rule 2". */
  number: string;
  heading: string;
  text: string;
};

export type PracticeInstrumentDetail = PracticeInstrument & {
  provisions: PracticeProvision[];
};

export type CourtForm = {
  id: string;
  code: string;
  title: string;
  description: string;
  court: string;
  jurisdiction: string;
  instrumentId?: string | null;
};

export type CourtFormDetail = CourtForm & {
  /** Boilerplate ready to be copied into a document. */
  content: string;
};

export type StatuteCase = {
  id: string;
  title: string;
  citation: string;
  court: string;
  year: number;
  treatment: Treatment;
  section: string;
};

export type DictionaryEntry = {
  id: string;
  term: string;
  kind: "term" | "maxim";
  definition: string;
  /** The judgment that judicially defined the term, where one did. */
  sourceCaseId?: string | null;
  sourceCitation?: string | null;
};

export type DictionaryEntryDetail = DictionaryEntry & {
  appliedCases: CaseSummary[];
};

export type SecondarySourceKind = "journal-article" | "textbook-excerpt" | "commentary";

export type SecondarySource = {
  id: string;
  title: string;
  kind: SecondarySourceKind;
  author: string;
  publication: string;
  year: number;
  practiceArea?: string | null;
  citation?: string | null;
  abstract: string;
};

export type SecondarySourceDetail = SecondarySource & {
  excerpt: string;
};

export type SavedCase = {
  id: string;
  title: string;
  citation: string;
  court: string;
  year: number;
  treatment: Treatment;
  savedAt: string;
  note?: string | null;
};

export type LibraryFolder = {
  id: string;
  name: string;
  color: string;
  cases: SavedCase[];
  createdAt: string;
};

export type Matter = {
  id: string;
  ref: string;
  name: string;
  client: string;
  practiceArea: string;
  status: "active" | "closed";
  cases: SavedCase[];
  createdAt: string;
  lastUpdated: string;
};

export type FirmCollection = {
  id: string;
  name: string;
  practiceArea: string;
  curator: string;
  curatorRole: string;
  description: string;
  cases: SavedCase[];
  suggestedCount: number;
  locked: boolean;
};

export type CollectionSuggestion = {
  id: string;
  collectionId: string;
  caseId: string;
  case: SavedCase;
  note?: string | null;
  status: "pending" | "approved" | "rejected";
  suggestedBy: string;
  createdAt: string;
};

export type DraftIssue = {
  id: string;
  text: string;
  authorities: string[];
  submission: string;
};

export type BundleDetails = {
  court: string;
  location: string;
  suitNo: string;
  appellant: string;
  respondent: string;
};

export type Brief = BundleDetails & {
  intro: string;
  conclusion: string;
  relief: string;
};

export type DraftWorkspace = {
  id: string;
  matterId?: string | null;
  notes: Record<string, string>;
  issues: DraftIssue[];
  bundleOrder: string[];
  bundleDetails: BundleDetails;
  brief: Brief;
  cases: SavedCase[];
};

export type DraftSummary = {
  id: string;
  matterId?: string | null;
  matterName?: string | null;
  court: string;
  suitNo: string;
  appellant: string;
  respondent: string;
  issueCount: number;
  createdAt: string;
  updatedAt: string;
};

/** The workspace after outlining, plus which issues were added and which were left alone. */
export type GeneratedOutline = DraftWorkspace & {
  addedIssueIds: string[];
  preservedIssueIds: string[];
};

export type ExportFile = {
  format: string;
  filename: string;
  mimeType: string;
  content: string;
};

export type Subscription = {
  planName: string;
  seatsActive: number;
  description: string;
};

export type UserProfile = {
  id: string;
  initials: string;
  avatarUrl?: string | null;
  name: string;
  role: string;
  email: string;
  workspace: string;
  accountRole: string;
  jurisdiction: string;
  /** Editorial staff may reach the CMS. The API enforces this independently. */
  editor: boolean;
  subscription: Subscription;
};

export type ResearchPreference = { label: string; enabled: boolean };

export type UserSession = {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastSeenAt: string;
  current: boolean;
};

export type ActivityItem = {
  id: string;
  timestamp: string;
  description: string;
};

/**
 * The editorial pipeline states, in the order a batch moves through them.
 * `Published` is terminal and only reachable through the publish action.
 */
export const BATCH_STATUSES = [
  "Digesting",
  "Headnote drafting",
  "Treatment check",
  "Editorial review",
  "Published",
] as const;

export type BatchStatus = (typeof BATCH_STATUSES)[number];

export type ReportBatch = {
  id: string;
  court: string;
  topic: string;
  status: BatchStatus | string;
  caseIds: string[];
  notes: string;
  assignee?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReportBatchDetail = ReportBatch & {
  /** The batch's judgments resolved, including any not yet published. */
  cases: CaseSummary[];
};

export type Coverage = {
  id: string;
  court: string;
  years: string;
  /** Computed from the archive, so it cannot drift from the real holdings. */
  count: string;
  sortOrder: number;
};

/** A judgment as editorial staff see it — including ones not yet published. */
export type AdminCase = CaseDetail & { published: boolean };

export type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  active: boolean;
  createdAt: string;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
};

/** Only returned once, at creation — the plaintext key is never retrievable again. */
export type CreatedApiKey = ApiKey & { key: string };
