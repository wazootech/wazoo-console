import { thrownMessage } from "@/lib/utils";

export type ImportCounts = { quads: number; chunks: number };

export interface ParsedQuad {
  subject: string;
  predicate: string;
  object: string;
  graph?: string;
}

// Parses a JSON array of quad objects, throwing a descriptive Error when the
// shape is wrong. `notArrayMessage` differs between file and paste input.
export function parseQuadJson(
  content: string,
  notArrayMessage: string,
  gt: (s: string) => string,
): ParsedQuad[] {
  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed)) {
    throw new Error(notArrayMessage);
  }
  // Validate structure
  const valid = parsed.every(
    (item: unknown): item is ParsedQuad =>
      typeof item === "object" &&
      item !== null &&
      "subject" in item &&
      "predicate" in item &&
      "object" in item,
  );
  if (!valid) {
    throw new Error(
      gt(
        "Each object in the array must contain 'subject', 'predicate', and 'object' fields.",
      ),
    );
  }
  return parsed;
}

// Plain text or CSV: one non-empty trimmed line per chunk.
export function splitLines(content: string): string[] {
  return content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

// JSON input is parsed as quads; anything else is split into text chunks.
export function parseImportText(
  content: string,
  isJson: boolean,
  notArrayMessage: string,
  gt: (s: string) => string,
): { quads: ParsedQuad[]; lines: string[] } {
  return isJson
    ? { quads: parseQuadJson(content, notArrayMessage, gt), lines: [] }
    : { quads: [], lines: splitLines(content) };
}

export function isSupportedFile(name: string): boolean {
  return [".json", ".csv", ".txt"].some((ext) => name.endsWith(ext));
}

export function pickImportPayload(
  mode: "file" | "paste",
  file: { fileContent: string; contentType: string },
  paste: { pasteContent: string; pasteType: "json" | "text" },
  gt: (s: string) => string,
): { payload: string; payloadType: string } | { error: string } {
  if (mode === "paste") {
    if (!paste.pasteContent.trim()) {
      return { error: gt("Paste some content to import.") };
    }
    return {
      payload: paste.pasteContent,
      payloadType:
        paste.pasteType === "json" ? "application/json" : "text/plain",
    };
  }
  if (!file.fileContent) {
    return { error: gt("No file content loaded to import.") };
  }
  return { payload: file.fileContent, payloadType: file.contentType };
}

// Literal gt calls live here so the gt-next extractor can harvest them.
export function unsupportedFileMessage(gt: (s: string) => string): string {
  return gt(
    "Unsupported file format. Please upload a .json, .csv, or .txt file.",
  );
}

export function importErrorMessage(
  err: unknown,
  gt: (s: string) => string,
): string {
  return thrownMessage(err) || gt("An unexpected error occurred during import");
}
