// Contract shape from POST /worlds/{id}/search (worlds-api#30 D6): the single
// content text field, score on the normalized 0–1 scale (null in fallback
// mode), and the required scoreType family.
export interface SearchResult {
  id?: string;
  subject: string;
  predicate: string;
  graph?: string;
  content: string;
  score: number | null;
  scoreType?: string;
}

// Subject-detail rows come from SPARQL bindings, not the search contract.
export interface DetailQuad {
  subject: string;
  predicate: string;
  object: string;
  graph: string;
}

export const MODE_BADGES: Record<string, { label: string; className: string }> =
  {
    semantic: {
      label: "Semantic Mode (vector)",
      className: "text-violet-400 bg-violet-950/20 border-violet-900/50",
    },
    keyword: {
      label: "Keyword Mode (full-text)",
      className: "text-sky-400 bg-sky-950/20 border-sky-900/50",
    },
    hybrid: {
      label: "Hybrid Mode (vector + keyword)",
      className: "text-emerald-400 bg-emerald-950/20 border-emerald-900/50",
    },
    fallback: {
      label: "Fallback Mode (SQL LIKE)",
      className: "text-amber-500 bg-amber-950/20 border-amber-900/50",
    },
  };

// Derived type options from rdf:type triples found in the current results.
export function getTypeOptions(results: SearchResult[]): string[] {
  return Array.from(
    new Set(
      results
        .filter((r) => r.predicate.includes("#type"))
        .map((r) => r.content)
        .filter((v): v is string => Boolean(v)),
    ),
  ).sort();
}

// Client-side filtering over the fetched results.
export function filterResults(
  results: SearchResult[],
  typeFilter: string,
  propFilter: string,
  labelFilter: string,
): SearchResult[] {
  return results.filter((r) => {
    if (typeFilter) {
      const typedSubjects = new Set(
        results
          .filter(
            (t) => t.predicate.includes("#type") && t.content === typeFilter,
          )
          .map((t) => t.subject),
      );
      if (!typedSubjects.has(r.subject)) return false;
    }
    if (
      propFilter &&
      !r.predicate.toLowerCase().includes(propFilter.toLowerCase())
    ) {
      return false;
    }
    if (
      labelFilter &&
      !r.content.toLowerCase().includes(labelFilter.toLowerCase())
    ) {
      return false;
    }
    return true;
  });
}
