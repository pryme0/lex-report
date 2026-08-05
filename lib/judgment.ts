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

export type JudgmentBlock =
  | { kind: "heading"; text: string }
  | { kind: "judge"; judge: string; text: string; isLead: boolean }
  | { kind: "numbered"; number: string; text: string }
  | { kind: "paragraph"; text: string };

export function parseJudgmentText(fullText: string): JudgmentBlock[] {
  return fullText
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block): JudgmentBlock => {
      if (/^JUDGMENT$/i.test(block)) {
        return { kind: "heading", text: block };
      }

      const leadHeading = block.match(
        /^([A-Z][A-Z\s,.]+J\.?S\.?C\.?)\s*\((Delivering the Lead Judgment)\):?\s*$/i,
      );
      if (leadHeading) {
        return {
          kind: "judge",
          judge: leadHeading[1].trim(),
          text: leadHeading[2],
          isLead: true,
        };
      }

      const numbered = block.match(/^(\d+)\.\s+([\s\S]+)$/);
      if (numbered) {
        return { kind: "numbered", number: numbered[1], text: numbered[2] };
      }

      const concurrence = block.match(/^([A-Z][\w\s,.]+\sJ\.?S\.?C\.?):\s*(.+)$/);
      if (concurrence) {
        return {
          kind: "judge",
          judge: concurrence[1].trim(),
          text: concurrence[2].trim(),
          isLead: false,
        };
      }

      if (block.length < 80 && block === block.toUpperCase() && /[A-Z]/.test(block)) {
        return { kind: "heading", text: block };
      }

      return { kind: "paragraph", text: block };
    });
}

/** A slug safe for use as an element id / URL fragment. */
export function judgeAnchorId(judge: string, index: number): string {
  const slug = judge
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `opinion-${index}-${slug}`;
}
