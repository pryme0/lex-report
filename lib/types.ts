/**
 * Presentation-level types shared across the UI. Everything that describes an API payload
 * lives in `lib/api/types.ts`; these are the vocabularies the styling depends on.
 */

/**
 * Mirrors the citator vocabulary the API emits. The distinctions matter: distinguishing is
 * not damage to an authority, doubting is a warning, and only the last group unsettles it.
 */
export type Treatment =
  | "Followed"
  | "Applied"
  | "Approved"
  | "Considered"
  | "Explained"
  | "Referred to"
  | "Distinguished"
  | "Doubted"
  | "Questioned"
  | "Not followed"
  | "Overruled in part"
  | "Overruled"
  | "Departed from"
  | "Per incuriam";

export const tcls: Record<Treatment, string> = {
  Followed: "followed",
  Applied: "followed",
  Approved: "followed",
  Considered: "neutral",
  Explained: "neutral",
  "Referred to": "neutral",
  Distinguished: "distinguished",
  Doubted: "questioned",
  Questioned: "questioned",
  "Not followed": "questioned",
  "Overruled in part": "questioned",
  Overruled: "overruled",
  "Departed from": "overruled",
  "Per incuriam": "overruled",
};

export type Standing = "Good Law" | "Cautionary" | "Bad Law";
