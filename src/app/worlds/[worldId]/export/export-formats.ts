export interface ExportFormat {
  id: string;
  name: string;
  mime: string;
  ext: string;
  description: string;
  example: string;
}

export const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: "json",
    name: "JSON (Quads)",
    mime: "application/json",
    ext: ".json",
    description:
      "Array of quad objects with subject, predicate, object, and graph fields.",
    example: '[{"subject": "ex:s", "predicate": "ex:p", "object": "ex:o"}]',
  },
  {
    id: "turtle",
    name: "Turtle",
    mime: "text/turtle",
    ext: ".ttl",
    description:
      "Compact RDF Turtle syntax with prefixes and graph directives.",
    example: '<http://example.org/s> <http://example.org/p> "object" .',
  },
  {
    id: "n-quads",
    name: "N-Quads",
    mime: "application/n-quads",
    ext: ".nq",
    description:
      "Line-based RDF format representing quads with explicit graph context.",
    example:
      "<http://ex.org/s> <http://ex.org/p> <http://ex.org/o> <http://ex.org/g> .",
  },
  {
    id: "n-triples",
    name: "N-Triples",
    mime: "application/n-triples",
    ext: ".nt",
    description: "Simple line-based triples format without graph qualifiers.",
    example: '<http://example.org/s> <http://example.org/p> "object" .',
  },
  {
    id: "text",
    name: "Plain Text",
    mime: "text/plain",
    ext: ".txt",
    description:
      "Raw text chunk lines imported or inferred for full-text search.",
    example: "Document content text line for search and indexing.",
  },
];
