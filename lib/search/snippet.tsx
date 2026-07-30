import type { ReactNode } from "react";

/**
 * Turns an FTS snippet into React nodes. Only `<b>` markup from the API is honoured;
 * anything else is stripped so hostile markup never reaches the DOM.
 */
export function renderSearchSnippet(snippet: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /<(\/?)(b)>/gi;
  let lastIndex = 0;
  let bold = false;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(snippet)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(...textNodes(snippet.slice(lastIndex, match.index), bold, key++));
    }
    if (match[1]) {
      bold = false;
    } else {
      bold = true;
    }
    lastIndex = re.lastIndex;
  }

  if (lastIndex < snippet.length) {
    nodes.push(...textNodes(snippet.slice(lastIndex), bold, key++));
  }

  return nodes;
}

function textNodes(raw: string, bold: boolean, keyBase: number): ReactNode[] {
  const cleaned = raw.replace(/<[^>]+>/g, "");
  if (!cleaned) return [];
  return [bold ? <strong key={keyBase}>{cleaned}</strong> : <span key={keyBase}>{cleaned}</span>];
}
