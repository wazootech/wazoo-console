"use client";

import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { ScopeNotices } from "./scope-notices";
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

      <ScopeNotices value={value} validation={validation} />
    </div>
  );
}
