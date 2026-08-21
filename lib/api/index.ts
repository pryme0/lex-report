import { buildQuery, http } from "./client";
import type {
  ActivityItem,
  ArchiveFilters,
  AuthorityMap,
  Brief,
  BundleDetails,
  CaseCitationLookupResult,
  CaseDetail,
  CaseIndexItem,
  CaseSearchParams,
  CaseSearchResult,
  CaseSummary,
  CitationGraph,
  Citator,
  CollectionSuggestion,
  CourtForm,
  CourtFormDetail,
  Coverage,
  DictionaryEntry,
  DictionaryEntryDetail,
  SecondarySource,
  SecondarySourceDetail,
  SecondarySourceKind,
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
  SimilarCase,
  StatuteCase,
  StatuteDetail,
  StatuteListItem,
  Subscription,
  UserProfile,
  UserSession,
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
    month: params.month,
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
    http.get<CaseSearchResult>(`/cases/search${searchQuery(params)}`),
  index: (q?: string) => http.get<CaseIndexItem[]>(`/cases/index${buildQuery({ q })}`),
  citationLookup: (elrNumber: number) =>
    http.get<CaseCitationLookupResult>(`/cases/citation-lookup${buildQuery({ elrNumber })}`),
  detail: (id: string) => http.get<CaseDetail>(`/cases/${encodeURIComponent(id)}`),
  citator: (id: string) => http.get<Citator>(`/cases/${encodeURIComponent(id)}/citator`),
  citationGraph: (id: string) =>
    http.get<CitationGraph>(`/cases/${encodeURIComponent(id)}/citation-graph`),
  similar: (id: string) =>
    http.get<SimilarCase[]>(`/cases/${encodeURIComponent(id)}/similar`),
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
  exportInstrument: (id: string, format: "text" | "pdf" = "text") =>
    http.get<ExportFile>(
      `/practice/instruments/${encodeURIComponent(id)}/export?format=${format}`,
    ),
  forms: (params: { court?: string; jurisdiction?: string } = {}) =>
    http.get<CourtForm[]>(`/practice/forms${buildQuery(params)}`),
  form: (id: string) =>
    http.get<CourtFormDetail>(`/practice/forms/${encodeURIComponent(id)}`),
  exportForm: (id: string, format: "text" | "pdf" = "text") =>
    http.get<ExportFile>(`/practice/forms/${encodeURIComponent(id)}/export?format=${format}`),
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

export const secondarySourcesApi = {
  list: (
    params: { q?: string; kind?: "all" | SecondarySourceKind; practiceArea?: string } = {},
  ) => http.get<SecondarySource[]>(`/secondary-sources${buildQuery(params)}`),
  detail: (id: string) =>
    http.get<SecondarySourceDetail>(`/secondary-sources/${encodeURIComponent(id)}`),
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
  removeAuthority: (id: string, issueId: string, caseId: string) =>
    http.delete<DraftWorkspace>(
      `/drafts/${encodeURIComponent(id)}/issues/${encodeURIComponent(issueId)}/authorities/${encodeURIComponent(caseId)}`,
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
  exportBundle: (id: string, format: "text" | "pdf" = "text") =>
    http.post<ExportFile>(
      `/drafts/${encodeURIComponent(id)}/export/bundle?format=${format}`,
    ),
  exportBrief: (id: string, format: "text" | "pdf" = "text") =>
    http.post<ExportFile>(
      `/drafts/${encodeURIComponent(id)}/export/brief?format=${format}`,
    ),
};

export const exportsApi = {
  researchBundle: (body: { caseIds?: string[]; matterId?: string; format?: "text" | "pdf" }) =>
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
  logout: () => http.post<{ message: string }>("/auth/logout"),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return http.postForm<UserProfile>("/users/me/avatar", form);
  },
  removeAvatar: () => http.delete<UserProfile>("/users/me/avatar"),
  sessions: () => http.get<UserSession[]>("/users/me/sessions"),
  revokeSession: (id: string) =>
    http.delete<{ message: string }>(`/users/me/sessions/${encodeURIComponent(id)}`),
  revokeOtherSessions: () =>
    http.delete<{ revoked: number }>("/users/me/sessions/others"),
  changePassword: (currentPassword: string, newPassword: string) =>
    http.post<{ message: string }>("/auth/change-password", {
      currentPassword,
      newPassword,
    }),
  deleteAccount: (password: string) =>
    http.post<{ message: string }>("/auth/delete-account", { password }),
};

export { ApiError } from "./client";
export * from "./types";
