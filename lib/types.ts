export type Treatment = "Followed" | "Distinguished" | "Overruled" | "Questioned";

export type CaseItem = {
  id: string;
  title: string;
  citation: string;
  court: string;
  year: number;
  judges: string;
  area: string;
  posture: string;
  ratio: string;
  treatment: Treatment;
  strength: number;
  readTime: string;
  facts: string;
  holding: string;
  issues: string[];
  authorities: string[];
};

export const tcls: Record<Treatment, string> = {
  Followed: "followed",
  Distinguished: "distinguished",
  Questioned: "questioned",
  Overruled: "overruled",
};
