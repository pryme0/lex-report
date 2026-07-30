export type Treatment = "Followed" | "Distinguished" | "Overruled" | "Questioned";

// caseId is only set when the cited case exists as a CaseItem in this archive.
export type CitedCase = {
  title: string;
  caseId?: string;
};

export type CitedStatute = {
  title: string;
  section?: string;
};

export type AppealOutcome = "Affirmed" | "Reversed" | "Remitted";

// This case's own appeal trail — how it moved through the court hierarchy to reach this decision.
export type DirectHistoryEntry = {
  court: string;
  outcome: AppealOutcome;
  citation: string;
  year: number;
};

// caseId is only set when the citing case exists as a CaseItem in this archive.
export type CitingCase = {
  caseId?: string;
  title: string;
  citation: string;
  treatment: Treatment;
  year: number;
};

export type CaseItem = {
  id: string;
  title: string;
  citation: string;
  court: string;
  year: number;
  judges: string;
  area: string;
  // Hierarchical subject classification for the Digest, e.g. "Banking & Secured Credit → Floating Charges".
  // Optional: list/summary fetches from the API don't populate this — the Digest
  // reads its grouped structure directly from /digest instead.
  digestArea?: string;
  posture: string;
  ratio: string;
  treatment: Treatment;
  strength: number;
  readTime: string;
  // The fields below are only populated on a full detail fetch (GET /cases/:code
  // merged with GET /cases/:code/citator) — list/summary fetches leave them undefined.
  facts?: string;
  holding?: string;
  issues?: string[];
  citedCases?: CitedCase[];
  citedStatutes?: CitedStatute[];
  directHistory?: DirectHistoryEntry[];
  citingCases?: CitingCase[];
};

export const tcls: Record<Treatment, string> = {
  Followed: "followed",
  Distinguished: "distinguished",
  Questioned: "questioned",
  Overruled: "overruled",
};

export type StatuteSection = {
  number: string;
  heading: string;
  text: string;
  // Populated by the API (server computes the section-range match) — absent
  // when this type is used for the static mock dataset.
  interpretingCases?: { caseCode: string; caseTitle: string }[];
};

export type Statute = {
  id: string;
  title: string;
  shortTitle: string;
  year: number;
  sections: StatuteSection[];
};

export type DictionaryEntry = {
  id: string;
  term: string;
  kind: "term" | "maxim";
  definition: string;
  appliedIn: string[]; // CaseItem ids
};

export type Standing = "Good Law" | "Cautionary" | "Bad Law";

export function deriveStanding(citingCases: CitingCase[]): Standing {
  if (citingCases.some(c => c.treatment === "Overruled")) return "Bad Law";
  if (citingCases.some(c => c.treatment === "Distinguished" || c.treatment === "Questioned")) return "Cautionary";
  return "Good Law";
}
