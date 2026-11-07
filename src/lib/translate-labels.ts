import type { GTTranslationOptions } from "gt-next";

/**
 * Translate a world-tab label through gt with a literal call per known label,
 * so the gt-next static extractor can harvest each string at build time.
 * Unknown labels fall back to the raw label.
 */
export function translateWorldTabLabel(
  gt: (s: string, o?: GTTranslationOptions) => string,
  label: string,
): string {
  switch (label) {
    case "Overview":
      return gt("Overview");
    case "SPARQL":
      return gt("SPARQL");
    case "Import":
      return gt("Import");
    case "Search":
      return gt("Search");
    // Shares the nav label's context string so the hash matches the entry
    // already in the translation files (bare "Tokens" renders as "Fichas").
    case "Tokens":
      return gt("Tokens", {
        $context:
          "Nav item: Wazoo API access tokens (wzt_ secrets), not game pieces or chips",
      });
    case "Usage":
      return gt("Usage");
    case "Export":
      return gt("Export");
    case "Billing":
      return gt("Billing");
    default:
      return label;
  }
}

/**
 * Translate a preset SPARQL query name with a literal gt call per known name,
 * so the gt-next static extractor can harvest each string at build time.
 */
export function translatePresetQueryName(
  gt: (s: string) => string,
  name: string,
): string {
  switch (name) {
    case "Insert sample triples":
      return gt("Insert sample triples");
    case "Select all triples":
      return gt("Select all triples");
    case "Find type definitions":
      return gt("Find type definitions");
    case "Ask check status":
      return gt("Ask check status");
    case "Delete sample triples":
      return gt("Delete sample triples");
    default:
      return name;
  }
}

/**
 * Translate an export-format description with a literal gt call per known
 * format id, so the gt-next static extractor can harvest each string at
 * build time. Unknown formats fall back to the raw description.
 */
export function translateExportFormatDescription(
  gt: (s: string) => string,
  fmt: { id: string; description: string },
): string {
  switch (fmt.id) {
    case "json":
      return gt(
        "Array of quad objects with subject, predicate, object, and graph fields.",
      );
    case "turtle":
      return gt(
        "Compact RDF Turtle syntax with prefixes and graph directives.",
      );
    case "n-quads":
      return gt(
        "Line-based RDF format representing quads with explicit graph context.",
      );
    case "n-triples":
      return gt("Simple line-based triples format without graph qualifiers.");
    case "text":
      return gt(
        "Raw text chunk lines imported or inferred for full-text search.",
      );
    default:
      return fmt.description;
  }
}
