import { buildQuery, http } from "./client";
import type {
  ActivityItem,
  AdminCase,
  ArchiveFilters,
  AuthorityMap,
  Brief,
  BundleDetails,
  CaseDetail,
  CaseIndexItem,
  CaseSearchParams,
  CaseSummary,
  CitationGraph,
  Citator,
  CollectionSuggestion,
  CourtForm,
  CourtFormDetail,
  Coverage,
  DictionaryEntry,
  DictionaryEntryDetail,
  DigestStatuteEntry,
  DigestSubjectArea,
  DraftSummary,
  DraftWorkspace,
  ExportFile,
  FirmCollection,
  GeneratedOutline,
  GlobalSearchKind,
  GlobalSearchResult,
  LibraryFolder,
  Matter,
  Paginated,
  PracticeInstrument,
  PracticeInstrumentDetail,
  PracticeInstrumentKind,
  ReportBatch,
  ReportBatchDetail,
  ResearchPreference,
  StatuteCase,
  StatuteDetail,
  StatuteListItem,
  Subscription,
  UserProfile,
} from "./types";

/** The API expects the literal strings "true"/"false" for its boolean filters. */
const flag = (value: boolean | undefined) => (value ? "true" : undefined);

const searchQuery = (params: CaseSearchParams) =>
  buildQuery({
    q: params.q,
    court: params.court,
    year: params.year,
    yearFrom: params.yearFrom,
    yearTo: params.yearTo,
    area: params.area,
    digestArea: params.digestArea,
    jurisdiction: params.jurisdiction,
    treatment: params.treatment,
    counsel: params.counsel,
    reportSeries: params.reportSeries,
    ratioOnly: flag(params.ratioOnly),
    positiveTreatment: flag(params.positiveTreatment),
    verified: flag(params.verified),
    sort: params.sort,
    page: params.page,
    limit: params.limit,
  });

export const casesApi = {
  search: (params: CaseSearchParams = {}) =>
    http.get<Paginated<CaseSummary>>(`/cases/search${searchQuery(params)}`),
  index: (q?: string) => http.get<CaseIndexItem[]>(`/cases/index${buildQuery({ q })}`),
  detail: (id: string) => http.get<CaseDetail>(`/cases/${encodeURIComponent(id)}`),
  citator: (id: string) => http.get<Citator>(`/cases/${encodeURIComponent(id)}/citator`),
  citationGraph: (id: string) =>
    http.get<CitationGraph>(`/cases/${encodeURIComponent(id)}/citation-graph`),
};

export const searchApi = {
  /** One query across judgments, legislation, the dictionary and the procedural corpus. */
  global: (q: string, params: { kind?: GlobalSearchKind; limit?: number } = {}) =>
    http.get<GlobalSearchResult>(`/search${buildQuery({ q, ...params })}`),
};

export const practiceApi = {
  instruments: (
    params: { court?: string; kind?: PracticeInstrumentKind; jurisdiction?: string } = {},
  ) => http.get<PracticeInstrument[]>(`/practice/instruments${buildQuery(params)}`),
  instrument: (id: string) =>
    http.get<PracticeInstrumentDetail>(`/practice/instruments/${encodeURIComponent(id)}`),
  forms: (params: { court?: string; jurisdiction?: string } = {}) =>
    http.get<CourtForm[]>(`/practice/forms${buildQuery(params)}`),
  form: (id: string) =>
    http.get<CourtFormDetail>(`/practice/forms/${encodeURIComponent(id)}`),
};

export const researchApi = {
  authorityMap: (params: { caseId?: string; q?: string }) =>
    http.get<AuthorityMap>(`/research/authority-map${buildQuery(params)}`),
};

export const digestApi = {
  subjects: () => http.get<DigestSubjectArea[]>("/digest/subjects"),
  statutes: () => http.get<DigestStatuteEntry[]>("/digest/statutes"),
};

export const legislationApi = {
  list: (jurisdiction?: string) =>
    http.get<StatuteListItem[]>(`/legislation${buildQuery({ jurisdiction })}`),
  detail: (id: string) => http.get<StatuteDetail>(`/legislation/${encodeURIComponent(id)}`),
  cases: (id: string) => http.get<StatuteCase[]>(`/legislation/${encodeURIComponent(id)}/cases`),
  sectionCases: (id: string, section: string) =>
    http.get<StatuteCase[]>(
      `/legislation/${encodeURIComponent(id)}/sections/${encodeURIComponent(section)}/cases`,
    ),
};

export const dictionaryApi = {
  list: (params: { q?: string; kind?: "all" | "term" | "maxim" } = {}) =>
    http.get<DictionaryEntry[]>(`/dictionary${buildQuery(params)}`),
  detail: (id: string) =>
    http.get<DictionaryEntryDetail>(`/dictionary/${encodeURIComponent(id)}`),
};

export const libraryApi = {
  listFolders: () => http.get<LibraryFolder[]>("/library/folders"),
  createFolder: (body: { name: string; color: string }) =>
    http.post<LibraryFolder>("/library/folders", body),
  updateFolder: (id: string, body: { name?: string; color?: string }) =>
    http.patch<LibraryFolder>(`/library/folders/${encodeURIComponent(id)}`, body),
  deleteFolder: (id: string) =>
    http.delete<{ deleted: boolean }>(`/library/folders/${encodeURIComponent(id)}`),
  addCase: (folderId: string, body: { caseId: string; note?: string }) =>
    http.post<LibraryFolder>(`/library/folders/${encodeURIComponent(folderId)}/cases`, body),
  updateNote: (folderId: string, caseId: string, note: string) =>
    http.put<LibraryFolder>(
      `/library/folders/${encodeURIComponent(folderId)}/cases/${encodeURIComponent(caseId)}`,
      { note },
    ),
  removeCase: (folderId: string, caseId: string) =>
    http.delete<LibraryFolder>(
      `/library/folders/${encodeURIComponent(folderId)}/cases/${encodeURIComponent(caseId)}`,
    ),
};

export const mattersApi = {
  list: (status: "all" | "active" | "closed" = "all") =>
    http.get<Matter[]>(`/matters${buildQuery({ status })}`),
  detail: (id: string) => http.get<Matter>(`/matters/${encodeURIComponent(id)}`),
  create: (body: { name: string; client: string; ref?: string; practiceArea?: string }) =>
    http.post<Matter>("/matters", body),
  update: (
    id: string,
    body: { status?: "active" | "closed"; name?: string; client?: string; practiceArea?: string },
  ) => http.patch<Matter>(`/matters/${encodeURIComponent(id)}`, body),
  remove: (id: string) =>
    http.delete<{ deleted: boolean }>(`/matters/${encodeURIComponent(id)}`),
  addCase: (id: string, body: { caseId: string; note?: string }) =>
    http.post<Matter>(`/matters/${encodeURIComponent(id)}/cases`, body),
  removeCase: (id: string, caseId: string) =>
    http.delete<Matter>(
      `/matters/${encodeURIComponent(id)}/cases/${encodeURIComponent(caseId)}`,
    ),
};

export const firmApi = {
  listCollections: (practiceArea?: string) =>
    http.get<FirmCollection[]>(`/firm/collections${buildQuery({ practiceArea })}`),
  collection: (id: string) =>
    http.get<FirmCollection>(`/firm/collections/${encodeURIComponent(id)}`),
  createCollection: (body: {
    name: string;
    practiceArea?: string;
    description?: string;
  }) => http.post<FirmCollection>("/firm/collections", body),
  deleteCollection: (id: string) =>
    http.delete<{ deleted: boolean }>(`/firm/collections/${encodeURIComponent(id)}`),
  removeCase: (id: string, caseId: string) =>
    http.delete<FirmCollection>(
      `/firm/collections/${encodeURIComponent(id)}/cases/${encodeURIComponent(caseId)}`,
    ),
  suggest: (id: string, body: { caseId: string; note?: string }) =>
    http.post<CollectionSuggestion>(
      `/firm/collections/${encodeURIComponent(id)}/suggestions`,
      body,
    ),
  listSuggestions: (id: string, status: "pending" | "approved" | "rejected" = "pending") =>
    http.get<CollectionSuggestion[]>(
      `/firm/collections/${encodeURIComponent(id)}/suggestions${buildQuery({ status })}`,
    ),
  approve: (id: string, suggestionId: string) =>
    http.post<FirmCollection>(
      `/firm/collections/${encodeURIComponent(id)}/suggestions/${encodeURIComponent(suggestionId)}/approve`,
    ),
  reject: (id: string, suggestionId: string) =>
    http.post<{ id: string; status: string }>(
      `/firm/collections/${encodeURIComponent(id)}/suggestions/${encodeURIComponent(suggestionId)}/reject`,
    ),
};

export const draftsApi = {
  list: (params: { page?: number; limit?: number } = {}) =>
    http.get<Paginated<DraftSummary>>(`/drafts${buildQuery(params)}`),
  create: (body: { matterId?: string } = {}) => http.post<DraftWorkspace>("/drafts", body),
  detail: (id: string) => http.get<DraftWorkspace>(`/drafts/${encodeURIComponent(id)}`),
  remove: (id: string) =>
    http.delete<{ deleted: boolean }>(`/drafts/${encodeURIComponent(id)}`),
  updateNote: (id: string, caseId: string, note: string) =>
    http.put<DraftWorkspace>(
      `/drafts/${encodeURIComponent(id)}/notes/${encodeURIComponent(caseId)}`,
      { note },
    ),
  createIssue: (id: string, body: { text: string; submission?: string; authorities?: string[] }) =>
    http.post<DraftWorkspace>(`/drafts/${encodeURIComponent(id)}/issues`, body),
  updateIssue: (
    id: string,
    issueId: string,
    body: { text?: string; submission?: string; authorities?: string[] },
  ) =>
    http.put<DraftWorkspace>(
      `/drafts/${encodeURIComponent(id)}/issues/${encodeURIComponent(issueId)}`,
      body,
    ),
  deleteIssue: (id: string, issueId: string) =>
    http.delete<DraftWorkspace>(
      `/drafts/${encodeURIComponent(id)}/issues/${encodeURIComponent(issueId)}`,
    ),
  addAuthority: (id: string, issueId: string, caseId: string) =>
    http.post<DraftWorkspace>(
      `/drafts/${encodeURIComponent(id)}/issues/${encodeURIComponent(issueId)}/authorities`,
      { caseId },
    ),
  updateBundleOrder: (id: string, caseIds: string[]) =>
    http.put<DraftWorkspace>(`/drafts/${encodeURIComponent(id)}/bundle/order`, { caseIds }),
  updateBundleDetails: (id: string, body: Partial<BundleDetails>) =>
    http.put<DraftWorkspace>(`/drafts/${encodeURIComponent(id)}/bundle/details`, body),
  updateBrief: (id: string, body: Partial<Brief>) =>
    http.put<DraftWorkspace>(`/drafts/${encodeURIComponent(id)}/brief`, body),
  /**
   * Adds the issues the outline is missing. Pass `regenerate` only to deliberately
   * discard hand-written issues and rebuild from scratch.
   */
  generateOutline: (id: string, regenerate = false) =>
    http.post<GeneratedOutline>(
      `/drafts/${encodeURIComponent(id)}/generate-outline`,
      { regenerate },
    ),
  exportBundle: (id: string) =>
    http.post<ExportFile>(`/drafts/${encodeURIComponent(id)}/export/bundle`),
  exportBrief: (id: string) =>
    http.post<ExportFile>(`/drafts/${encodeURIComponent(id)}/export/brief`),
};

export const exportsApi = {
  researchBundle: (body: { caseIds?: string[]; matterId?: string }) =>
    http.post<ExportFile>("/exports/research-bundle", body),
};

export const reportsApi = {
  published: (params: CaseSearchParams = {}) =>
    http.get<Paginated<CaseSummary>>(`/reports/published${searchQuery(params)}`),
  queue: (limit?: number) => http.get<ReportBatch[]>(`/reports/queue${buildQuery({ limit })}`),
  batches: (
    params: { status?: string; court?: string; assignee?: string; page?: number; limit?: number } = {},
  ) => http.get<Paginated<ReportBatch>>(`/reports/batches${buildQuery(params)}`),
  batch: (id: string) =>
    http.get<ReportBatchDetail>(`/reports/batches/${encodeURIComponent(id)}`),
  createBatch: (body: {
    court?: string;
    topic?: string;
    status?: string;
    caseIds?: string[];
  }) => http.post<ReportBatch>("/reports/batches", body),
  updateBatch: (
    id: string,
    body: { court?: string; topic?: string; assignee?: string; notes?: string },
  ) => http.patch<ReportBatchDetail>(`/reports/batches/${encodeURIComponent(id)}`, body),
  addBatchCase: (id: string, caseId: string) =>
    http.post<ReportBatchDetail>(`/reports/batches/${encodeURIComponent(id)}/cases`, {
      caseId,
    }),
  removeBatchCase: (id: string, caseId: string) =>
    http.delete<ReportBatchDetail>(
      `/reports/batches/${encodeURIComponent(id)}/cases/${encodeURIComponent(caseId)}`,
    ),
  /** Moves the batch one step through the editorial pipeline. Illegal moves 400. */
  setBatchStatus: (id: string, status: string) =>
    http.post<ReportBatchDetail>(`/reports/batches/${encodeURIComponent(id)}/status`, {
      status,
    }),
  /** Publishes every judgment in the batch and closes it. */
  publishBatch: (id: string) =>
    http.post<ReportBatchDetail>(`/reports/batches/${encodeURIComponent(id)}/publish`),
  deleteBatch: (id: string) =>
    http.delete<{ deleted: boolean }>(`/reports/batches/${encodeURIComponent(id)}`),
};

/**
 * Editorial write endpoints. These require the acting user to be flagged as editorial
 * staff; everyone else gets a 403.
 */
export const adminApi = {
  cases: (
    params: {
      q?: string;
      published?: boolean;
      verified?: boolean;
      court?: string;
      year?: number;
      page?: number;
      limit?: number;
    } = {},
  ) => http.get<Paginated<AdminCase>>(`/admin/cases${buildQuery(params)}`),
  case: (id: string) => http.get<AdminCase>(`/admin/cases/${encodeURIComponent(id)}`),
  createCase: (body: Record<string, unknown>) => http.post<AdminCase>("/admin/cases", body),
  updateCase: (id: string, body: Record<string, unknown>) =>
    http.patch<AdminCase>(`/admin/cases/${encodeURIComponent(id)}`, body),
  publishCase: (id: string) =>
    http.post<AdminCase>(`/admin/cases/${encodeURIComponent(id)}/publish`),
  unpublishCase: (id: string) =>
    http.post<AdminCase>(`/admin/cases/${encodeURIComponent(id)}/unpublish`),
  deleteCase: (id: string) =>
    http.delete<{ deleted: boolean }>(`/admin/cases/${encodeURIComponent(id)}`),

  createStatute: (body: Record<string, unknown>) =>
    http.post<StatuteDetail>("/admin/statutes", body),
  updateStatute: (id: string, body: Record<string, unknown>) =>
    http.patch<StatuteDetail>(`/admin/statutes/${encodeURIComponent(id)}`, body),
  deleteStatute: (id: string) =>
    http.delete<{ deleted: boolean }>(`/admin/statutes/${encodeURIComponent(id)}`),
  createSection: (statuteId: string, body: Record<string, unknown>) =>
    http.post<StatuteDetail>(
      `/admin/statutes/${encodeURIComponent(statuteId)}/sections`,
      body,
    ),
  updateSection: (statuteId: string, sectionId: string, body: Record<string, unknown>) =>
    http.patch<StatuteDetail>(
      `/admin/statutes/${encodeURIComponent(statuteId)}/sections/${encodeURIComponent(sectionId)}`,
      body,
    ),
  deleteSection: (statuteId: string, sectionId: string) =>
    http.delete<{ deleted: boolean }>(
      `/admin/statutes/${encodeURIComponent(statuteId)}/sections/${encodeURIComponent(sectionId)}`,
    ),
  createAmendment: (statuteId: string, body: Record<string, unknown>) =>
    http.post<StatuteDetail>(
      `/admin/statutes/${encodeURIComponent(statuteId)}/amendments`,
      body,
    ),
  deleteAmendment: (statuteId: string, amendmentId: string) =>
    http.delete<{ deleted: boolean }>(
      `/admin/statutes/${encodeURIComponent(statuteId)}/amendments/${encodeURIComponent(amendmentId)}`,
    ),

  createDictionaryEntry: (body: Record<string, unknown>) =>
    http.post<DictionaryEntryDetail>("/admin/dictionary", body),
  updateDictionaryEntry: (id: string, body: Record<string, unknown>) =>
    http.patch<DictionaryEntryDetail>(`/admin/dictionary/${encodeURIComponent(id)}`, body),
  deleteDictionaryEntry: (id: string) =>
    http.delete<{ deleted: boolean }>(`/admin/dictionary/${encodeURIComponent(id)}`),

  createInstrument: (body: Record<string, unknown>) =>
    http.post<PracticeInstrumentDetail>("/admin/practice/instruments", body),
  updateInstrument: (id: string, body: Record<string, unknown>) =>
    http.patch<PracticeInstrumentDetail>(
      `/admin/practice/instruments/${encodeURIComponent(id)}`,
      body,
    ),
  deleteInstrument: (id: string) =>
    http.delete<{ deleted: boolean }>(
      `/admin/practice/instruments/${encodeURIComponent(id)}`,
    ),
  createForm: (body: Record<string, unknown>) =>
    http.post<CourtFormDetail>("/admin/practice/forms", body),
  updateForm: (id: string, body: Record<string, unknown>) =>
    http.patch<CourtFormDetail>(`/admin/practice/forms/${encodeURIComponent(id)}`, body),
  deleteForm: (id: string) =>
    http.delete<{ deleted: boolean }>(`/admin/practice/forms/${encodeURIComponent(id)}`),

  /** Case counts are derived from the archive, so only the year span is settable. */
  setCoverage: (court: string, body: { years: string; sortOrder?: number }) =>
    http.put<Coverage>(`/admin/coverage/${encodeURIComponent(court)}`, body),
};

export const catalogApi = {
  coverage: () => http.get<Coverage[]>("/catalog/coverage"),
  /** Filter options derived from the archive, so they never offer an empty facet. */
  filters: () => http.get<ArchiveFilters>("/catalog/filters"),
};

export const usersApi = {
  profile: () => http.get<UserProfile>("/users/me"),
  updateProfile: (body: Partial<Omit<UserProfile, "id" | "subscription">>) =>
    http.patch<UserProfile>("/users/me", body),
  preferences: () => http.get<ResearchPreference[]>("/users/me/preferences"),
  updatePreferences: (preferences: ResearchPreference[]) =>
    http.patch<ResearchPreference[]>("/users/me/preferences", { preferences }),
  activity: () => http.get<ActivityItem[]>("/users/me/activity"),
  subscription: () => http.get<Subscription>("/billing/subscription"),
};

export { ApiError } from "./client";
export * from "./types";
