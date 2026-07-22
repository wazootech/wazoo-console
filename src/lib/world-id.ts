import { joyful } from "joyful";

export const WORLD_ID_PATTERN = /^[a-z][a-z0-9-]{2,62}$/;

export function validateWorldId(id: string): string | null {
  if (!id) return "World ID is required.";
  if (!/^[a-z]/.test(id)) return "Must start with a lowercase letter.";
  if (!/^[a-z0-9-]+$/.test(id))
    return "Only lowercase letters, digits, and hyphens allowed.";
  if (id.length < 3) return "Must be at least 3 characters.";
  if (id.length > 63) return "Must be 63 characters or fewer.";
  return null;
}

export function isWorldIdTaken(id: string, existingIds: Set<string>): boolean {
  return existingIds.has(id);
}

export function suggestWorldId(existingIds: Set<string>): string {
  for (let attempt = 0; attempt < 25; attempt++) {
    const candidate = joyful({
      pattern: ["color", "science"],
      maxLength: 40,
    });
    if (!existingIds.has(candidate)) return candidate;
  }
  const short = Math.random().toString(36).slice(2, 8);
  return `world-${short}`;
}
