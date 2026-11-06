import { getWorldsApiUrl } from "@/lib/utils";
import type { DetailQuad, SearchResult } from "./search-types";

export async function postSearch(
  worldId: string,
  token: string,
  body: { query: string; limit: number; minScore: number },
): Promise<{ results?: SearchResult[]; mode: string }> {
  const endpoint = `${getWorldsApiUrl()}/worlds/${encodeURIComponent(worldId)}/search`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Failed to search World Graph");
  }
  return data;
}

export async function fetchSubjectQuads(
  worldId: string,
  token: string | null,
  subject: string,
): Promise<DetailQuad[]> {
  const endpoint = `${getWorldsApiUrl()}/worlds/${encodeURIComponent(worldId)}/sparql`;
  const escaped = subject.replace(/[\\"]/g, (m) =>
    m === '"' ? '\\"' : "\\\\",
  );
  const query = `SELECT ?p ?o ?g WHERE { GRAPH ?g { <${escaped}> ?p ?o } }`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Failed to load subject detail");
  }
  const bindings: Array<Record<string, { value?: string } | undefined>> =
    data?.results?.bindings || [];
  return bindings.map((b) => ({
    subject,
    predicate: b.p?.value || "",
    object: b.o?.value || "",
    graph: b.g?.value || "",
  }));
}
