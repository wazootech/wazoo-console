export interface ScopeDefinition {
  name: string;
  label: string;
  description: string;
  isDefault: boolean;
}

export const VALID_PLATFORM_SCOPES: ScopeDefinition[] = [
  {
    name: "users.read",
    label: "Users (Read)",
    description: "Read user profile data and account info",
    isDefault: true,
  },
  {
    name: "users.write",
    label: "Users (Write)",
    description: "Manage API tokens and user settings",
    isDefault: false,
  },
  {
    name: "worlds.read",
    label: "Worlds (Read)",
    description: "Read world definitions, state, and tokens",
    isDefault: true,
  },
  {
    name: "worlds.write",
    label: "Worlds (Write)",
    description: "Create, update, and delete worlds",
    isDefault: true,
  },
  {
    name: "worlds.admin",
    label: "Worlds (Admin)",
    description: "Perform administrative world operations",
    isDefault: false,
  },
  {
    name: "usage.read",
    label: "Usage (Read)",
    description: "Access usage events and quota details",
    isDefault: true,
  },
  {
    name: "billing.read",
    label: "Billing (Read)",
    description: "Access billing state and invoices",
    isDefault: true,
  },
];

export const DEFAULT_PLATFORM_SCOPES: string[] = VALID_PLATFORM_SCOPES.filter(
  (s) => s.isDefault,
).map((s) => s.name);

export interface ScopeValidationResult {
  tokens: string[];
  unknownTokens: string[];
  hasAdminToken: boolean;
  isValid: boolean;
  errorMessage: string | null;
}

const VALID_SCOPE_NAMES = new Set(VALID_PLATFORM_SCOPES.map((s) => s.name));

export function parseScopes(scopeString: string): string[] {
  return scopeString.trim().split(/\s+/).filter(Boolean);
}

export function validateScopes(scopeString: string): ScopeValidationResult {
  const tokens = parseScopes(scopeString);
  const unknownTokens: string[] = [];
  let hasAdminToken = false;

  for (const token of tokens) {
    if (token === "admin") {
      hasAdminToken = true;
    } else if (!VALID_SCOPE_NAMES.has(token)) {
      unknownTokens.push(token);
    }
  }

  let errorMessage: string | null = null;
  if (hasAdminToken) {
    errorMessage =
      "The 'admin' scope is reserved for platform administrators and cannot be assigned to user API tokens.";
  } else if (unknownTokens.length > 0) {
    errorMessage = `Unknown scope${
      unknownTokens.length > 1 ? "s" : ""
    }: ${unknownTokens.join(", ")}. Valid scopes are: ${VALID_PLATFORM_SCOPES.map(
      (s) => s.name,
    ).join(", ")}.`;
  }

  return {
    tokens,
    unknownTokens,
    hasAdminToken,
    isValid: errorMessage === null,
    errorMessage,
  };
}
