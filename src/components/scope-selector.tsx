"use client";

import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, ShieldAlert } from "lucide-react";
import {
  VALID_PLATFORM_SCOPES,
  DEFAULT_PLATFORM_SCOPES,
  parseScopes,
  validateScopes,
  type ScopeValidationResult,
} from "@/lib/platform-scopes";

interface ScopeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

export function ScopeSelector({
  value,
  onChange,
  disabled = false,
  onValidationChange,
}: ScopeSelectorProps) {
  const activeScopes = parseScopes(value);
  const activeSet = new Set(activeScopes);
  const validation: ScopeValidationResult = validateScopes(value);

  useEffect(() => {
    onValidationChange?.(validation.isValid);
  }, [validation.isValid, onValidationChange]);

  function toggleScope(scopeName: string) {
    if (disabled) return;
    const newScopes = new Set(activeScopes);
    if (newScopes.has(scopeName)) {
      newScopes.delete(scopeName);
    } else {
      newScopes.add(scopeName);
    }
    // Maintain ordering as defined in VALID_PLATFORM_SCOPES, preserving any custom tokens
    const ordered = VALID_PLATFORM_SCOPES.map((s) => s.name).filter((name) =>
      newScopes.has(name),
    );
    const unknownTokens = activeScopes.filter(
      (s) => !VALID_PLATFORM_SCOPES.some((v) => v.name === s),
    );
    onChange([...ordered, ...unknownTokens].join(" "));
  }

  function handleSelectDefaults() {
    if (disabled) return;
    onChange(DEFAULT_PLATFORM_SCOPES.join(" "));
  }

  function handleClear() {
    if (disabled) return;
    onChange("");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="scope">Scopes</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleSelectDefaults}
            disabled={disabled}
          >
            Select defaults
          </Button>
          <span className="text-muted-foreground/40">•</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleClear}
            disabled={disabled}
          >
            Clear
          </Button>
        </div>
      </div>

      <Input
        id="scope"
        placeholder="e.g. users.read worlds.read"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={
          !validation.isValid
            ? "border-destructive focus-visible:ring-destructive"
            : ""
        }
      />

      {/* Selectable Chip Grid */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">
          Available Scopes:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {VALID_PLATFORM_SCOPES.map((scope) => {
            const isSelected = activeSet.has(scope.name);
            return (
              <button
                key={scope.name}
                type="button"
                onClick={() => toggleScope(scope.name)}
                disabled={disabled}
                aria-pressed={isSelected}
                title={scope.description}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
                    : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {isSelected ? <Check className="size-3" /> : null}
                <span>{scope.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Default scope indicator */}
      {value.trim() === "" ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Note:</span> Leaving
          this empty will automatically grant all default scopes:{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            {DEFAULT_PLATFORM_SCOPES.join(" ")}
          </code>
        </p>
      ) : null}

      {/* Reserved Admin Scope Warning */}
      {validation.hasAdminToken ? (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-600 dark:text-amber-400">
          <ShieldAlert className="size-4 shrink-0 mt-0.5" />
          <div>
            <strong>Reserved Scope:</strong> The{" "}
            <code className="font-mono">admin</code> scope cannot be requested
            via user API tokens and must be manually seeded.
          </div>
        </div>
      ) : null}

      {/* Validation Error Banner */}
      {!validation.isValid &&
      !validation.hasAdminToken &&
      validation.errorMessage ? (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div>{validation.errorMessage}</div>
        </div>
      ) : null}
    </div>
  );
}
