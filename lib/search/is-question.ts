const INTERROGATIVE_STARTS = [
  "what", "who", "whom", "whose", "when", "where", "why", "how",
  "does", "do", "did", "is", "are", "was", "were", "can", "could",
  "should", "would", "will", "explain", "define", "describe", "summarize", "summarise",
  // Imperative asks ("list 5 criminal cases in 2025", "find cases on...") read as
  // Google-style natural-language search rather than a case-title lookup, same as a
  // real question — so they should also trigger the AI overview card.
  "list", "show", "find", "give", "tell", "name", "identify", "compare", "outline", "cite",
];

/**
 * Distinguishes a natural-language question ("what is the standard of proof in criminal
 * cases?") from a lookup-style search (a case title, party name, or citation) so the search
 * page knows when to show an AI-generated answer above the judgment list versus just the list.
 * Deliberately a light heuristic, not a classifier — a query that's really a lookup but happens
 * to trip this (e.g. "how CBN regulates forex") only costs an extra AI-answer card the user can
 * ignore; a real question that's missed still gets a normal (if less useful) keyword search.
 */
export function looksLikeQuestion(query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return false;
  if (trimmed.endsWith("?")) return true;

  const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "");
  if (!firstWord || !INTERROGATIVE_STARTS.includes(firstWord)) return false;

  // A short "is/are/how"-led phrase is more likely a case title fragment ("Re Application of...")
  // than a real question, so require enough words for it to read as a sentence.
  return trimmed.split(/\s+/).length >= 4;
}
