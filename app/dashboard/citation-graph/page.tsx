"use client";

import { CitationGraph } from "@/components/CitationGraph";
import { EmptyState, ErrorState, LoadingState } from "@/components/AsyncState";
import { useDashboard } from "@/contexts/DashboardContext";
import { casesApi } from "@/lib/api";
import { useApiQuery } from "@/lib/api/hooks";

export default function Page() {
  const { graphCaseId, viewGraph, showToast } = useDashboard();
  const indexQuery = useApiQuery("cases:index", () => casesApi.index());

  if (indexQuery.loading && indexQuery.data === null) {
    return <LoadingState label="Loading cases…" />;
  }

  if (indexQuery.error) {
    return <ErrorState message={indexQuery.error} onRetry={indexQuery.refetch} />;
  }

  const cases = indexQuery.data ?? [];

  if (cases.length === 0) {
    return (
      <EmptyState message="No cases in the archive yet — search and save authorities to explore citation graphs." />
    );
  }

  const caseId = graphCaseId ?? cases[0].id;

  return (
    <CitationGraph
      caseId={caseId}
      cases={cases}
      onCaseSelect={viewGraph}
      onAction={showToast}
    />
  );
}
