import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { GlobalSearchHit } from "@/lib/api";
import { routes } from "@/lib/routes";

export function globalSearchDestination(hit: GlobalSearchHit): string | { caseId: string } {
  switch (hit.kind) {
    case "case":
      return { caseId: hit.refId };
    case "statute":
      return routes.statute(hit.refId);
    case "section":
      return hit.parentId
        ? routes.statuteSection(hit.parentId, hit.refId)
        : routes.statute(hit.refId);
    case "dictionary":
      return routes.dictionaryEntry(hit.refId);
    case "instrument":
      return routes.instrument(hit.refId);
    case "provision":
      return hit.parentId ? routes.instrument(hit.parentId) : "/dashboard/practice";
    case "form":
      return routes.form(hit.refId);
  }
}

export function navigateGlobalSearchHit(
  hit: GlobalSearchHit,
  router: AppRouterInstance,
  openCase: (id: string) => void,
) {
  const dest = globalSearchDestination(hit);
  if (typeof dest === "object") {
    openCase(dest.caseId);
    return;
  }
  router.push(dest);
}

export const GLOBAL_SEARCH_KIND_LABELS: Record<GlobalSearchHit["kind"], string> = {
  case: "Judgments",
  statute: "Statutes",
  section: "Statute sections",
  dictionary: "Dictionary",
  instrument: "Practice instruments",
  provision: "Provisions",
  form: "Court forms",
};
