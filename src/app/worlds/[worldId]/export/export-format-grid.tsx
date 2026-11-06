import { FileCode } from "lucide-react";
import { EXPORT_FORMATS, type ExportFormat } from "./export-formats";

interface ExportFormatGridProps {
  selectedFormat: ExportFormat;
  onSelect: (format: ExportFormat) => void;
}

/** Format Selector Grid */
export function ExportFormatGrid({
  selectedFormat,
  onSelect,
}: ExportFormatGridProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <FileCode className="size-4 text-primary" />
          Select Export Format
        </h2>
        <span className="text-xs text-zinc-500">5 formats available</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPORT_FORMATS.map((fmt) => {
          const isSelected = selectedFormat.id === fmt.id;
          return (
            <button
              key={fmt.id}
              type="button"
              onClick={() => onSelect(fmt)}
              className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSelected
                  ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(255,140,0,0.15)] text-white"
                  : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/40 text-zinc-300"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">
                    {fmt.name}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${
                      isSelected
                        ? "border-primary/40 bg-primary/20 text-primary-foreground"
                        : "border-zinc-800 bg-zinc-900 text-zinc-400"
                    }`}
                  >
                    {fmt.ext}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {fmt.description}
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-800/60 text-[11px] font-mono text-zinc-500 truncate">
                {fmt.mime}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
