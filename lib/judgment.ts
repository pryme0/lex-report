import type { CaseDetail, Counsel } from "@/lib/api";

export function judgmentCitation(item: Pick<CaseDetail, "report" | "neutralCitation" | "citation">): string {
  return item.report?.seriesCitation ?? item.neutralCitation ?? item.citation;
}

export async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy path.
    }
  }

  if (typeof document === "undefined") return false;

  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(area);
  return ok;
}

const SIDE_LABELS: Record<Counsel["side"], string> = {
  appellant: "For the appellant",
  respondent: "For the respondent",
  applicant: "For the applicant",
  amicus: "Amicus curiae",
};

const SIDE_ORDER: Counsel["side"][] = ["appellant", "respondent", "applicant", "amicus"];

export function counselBySide(counsel: Counsel[]) {
  return SIDE_ORDER.map((side) => ({
    side,
    label: SIDE_LABELS[side],
    members: counsel
      .filter((c) => c.side === side)
      .sort((a, b) => Number(b.lead) - Number(a.lead)),
  })).filter((group) => group.members.length > 0);
}
