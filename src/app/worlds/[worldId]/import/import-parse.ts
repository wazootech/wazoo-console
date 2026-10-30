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
      "Each object in the array must contain 'subject', 'predicate', and 'object' fields.",
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
): { quads: ParsedQuad[]; lines: string[] } {
  return isJson
    ? { quads: parseQuadJson(content, notArrayMessage), lines: [] }
    : { quads: [], lines: splitLines(content) };
}

export const UNSUPPORTED_FILE_MESSAGE =
  "Unsupported file format. Please upload a .json, .csv, or .txt file.";

export function isSupportedFile(name: string): boolean {
  return [".json", ".csv", ".txt"].some((ext) => name.endsWith(ext));
}

export function pickImportPayload(
  mode: "file" | "paste",
  file: { fileContent: string; contentType: string },
  paste: { pasteContent: string; pasteType: "json" | "text" },
): { payload: string; payloadType: string } | { error: string } {
  if (mode === "paste") {
    if (!paste.pasteContent.trim()) {
      return { error: "Paste some content to import." };
    }
    return {
      payload: paste.pasteContent,
      payloadType:
        paste.pasteType === "json" ? "application/json" : "text/plain",
    };
  }
  if (!file.fileContent) {
    return { error: "No file content loaded to import." };
  }
  return { payload: file.fileContent, payloadType: file.contentType };
}
