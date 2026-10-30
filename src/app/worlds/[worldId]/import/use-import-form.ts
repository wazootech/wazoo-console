"use client";

import { useState } from "react";
import { thrownMessage } from "@/lib/utils";
import { postImport } from "./import-api";
import {
  isSupportedFile,
  pickImportPayload,
  parseImportText,
  UNSUPPORTED_FILE_MESSAGE,
  type ParsedQuad,
} from "./import-parse";

export function useImportForm(worldId: string) {
  const [token, setToken] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [contentType, setContentType] = useState<string>("application/json");
  const [parsedQuads, setParsedQuads] = useState<ParsedQuad[]>([]);
  const [parsedLines, setParsedLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    quads: number;
    chunks: number;
  } | null>(null);
  const [mode, setMode] = useState<"file" | "paste">("file");
  const [pasteContent, setPasteContent] = useState("");
  const [pasteType, setPasteType] = useState<"json" | "text">("json");

  const processFile = (selectedFile: File) => {
    setError(null);
    setSuccess(null);
    setFile(selectedFile);

    const isJson = selectedFile.name.endsWith(".json");

    if (!isSupportedFile(selectedFile.name)) {
      setError(UNSUPPORTED_FILE_MESSAGE);
      setFile(null);
      return;
    }

    const type = isJson ? "application/json" : "text/plain";
    setContentType(type);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);

      try {
        const parsed = parseImportText(
          content,
          isJson,
          "JSON file must contain an array of quad objects.",
        );
        setParsedQuads(parsed.quads);
        setParsedLines(parsed.lines);
      } catch (err) {
        setError(`JSON Parse Error: ${thrownMessage(err)}`);
        setFile(null);
      }
    };
    reader.readAsText(selectedFile);
  };

  function processPaste() {
    setError(null);
    setSuccess(null);

    try {
      const parsed = parseImportText(
        pasteContent,
        pasteType === "json",
        "JSON must contain an array of quad objects.",
      );
      setParsedQuads(parsed.quads);
      setParsedLines(parsed.lines);
    } catch (err) {
      setError(`JSON Parse Error: ${thrownMessage(err)}`);
      setParsedQuads([]);
      setParsedLines([]);
    }
  }

  async function handleImport() {
    if (!token) {
      setError("Please select or add a World Access Token first.");
      return;
    }
    // State set in this function is not visible until the next render, so
    // choose the payload and content type locally instead of reading state back.
    const picked = pickImportPayload(
      mode,
      { fileContent, contentType },
      { pasteContent, pasteType },
    );
    if ("error" in picked) {
      setError(picked.error);
      return;
    }
    const { payload, payloadType } = picked;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      setSuccess(await postImport(worldId, token, payload, payloadType));
      // Clear input state
      setFile(null);
      setFileContent("");
      setPasteContent("");
      setParsedQuads([]);
      setParsedLines([]);
    } catch (e) {
      setError(
        thrownMessage(e) || "An unexpected error occurred during import",
      );
    } finally {
      setLoading(false);
    }
  }

  return {
    setToken,
    file,
    fileContent,
    contentType,
    parsedQuads,
    parsedLines,
    loading,
    error,
    success,
    mode,
    setMode,
    pasteContent,
    setPasteContent,
    pasteType,
    setPasteType,
    processFile,
    processPaste,
    handleImport,
  };
}
