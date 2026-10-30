"use client";

import { useState, useRef } from "react";
import { Upload, FileText } from "lucide-react";

interface ImportFileInputProps {
  file: File | null;
  contentType: string;
  processFile: (file: File) => void;
}

export function ImportFileInput({
  file,
  contentType,
  processFile,
}: ImportFileInputProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <>
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/30"
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept=".json,.txt,.csv"
        />
        <Upload className="size-8 text-zinc-500 mb-3" />
        <p className="text-sm text-zinc-300 font-medium">
          Drag and drop file here
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          Supports JSON (quads), CSV, TXT (chunks)
        </p>
      </div>

      {file && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/60">
          <FileText className="size-5 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate text-zinc-200">
              {file.name}
            </p>
            <p className="text-[10px] text-zinc-500">
              {(file.size / 1024).toFixed(1)} KB • {contentType}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
