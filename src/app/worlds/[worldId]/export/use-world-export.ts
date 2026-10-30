"use client";

import { useState } from "react";
import { thrownMessage } from "@/lib/utils";
import { fetchExportText, InvalidWorldTokenError } from "./export-api";
import { EXPORT_FORMATS, type ExportFormat } from "./export-formats";

function downloadBlob(data: string, format: ExportFormat, worldId: string) {
  const blob = new Blob([data], { type: format.mime });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `world-${worldId}-${dateStr}${format.ext}`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function useWorldExport(worldId: string) {
  const [token, setToken] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(
    EXPORT_FORMATS[0],
  );
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalidTokenError, setInvalidTokenError] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [copied, setCopied] = useState(false);

  async function fetchExportData(format: ExportFormat) {
    if (!token) {
      setError("Please select or add a World Access Token first.");
      return null;
    }

    setError(null);
    setInvalidTokenError(false);
    setIsEmpty(false);

    try {
      const text = await fetchExportText(worldId, token, format);
      if (!text || text.trim() === "" || text.trim() === "[]") {
        setIsEmpty(true);
        setPreviewContent(null);
        return "";
      }

      setPreviewContent(text);
      return text;
    } catch (err) {
      if (err instanceof InvalidWorldTokenError) {
        setInvalidTokenError(true);
        setPreviewContent(null);
        return null;
      }
      setInvalidTokenError(false);
      setError(
        thrownMessage(err) || "An unexpected error occurred during export",
      );
      setPreviewContent(null);
      return null;
    }
  }

  async function handleFormatSelect(format: ExportFormat) {
    setSelectedFormat(format);
    setPreviewContent(null);
    setError(null);
    setInvalidTokenError(false);
    if (token) {
      setLoading(true);
      await fetchExportData(format);
      setLoading(false);
    }
  }

  async function handleLoadPreview() {
    if (!token) {
      setError("Please select or add a World Access Token first.");
      return;
    }
    setLoading(true);
    await fetchExportData(selectedFormat);
    setLoading(false);
  }

  async function handleDownload() {
    if (!token) {
      setError("Please select or add a World Access Token first.");
      return;
    }

    setDownloading(true);
    let data = previewContent;
    if (data === null) {
      data = await fetchExportData(selectedFormat);
    }

    setDownloading(false);

    if (data === null || isEmpty) return;

    downloadBlob(data, selectedFormat, worldId);
  }

  const handleCopy = () => {
    if (!previewContent) return;
    navigator.clipboard.writeText(previewContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return {
    token,
    setToken,
    selectedFormat,
    loading,
    downloading,
    error,
    invalidTokenError,
    previewContent,
    isEmpty,
    copied,
    handleFormatSelect,
    handleLoadPreview,
    handleDownload,
    handleCopy,
  };
}
