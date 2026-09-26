import { joyful } from "joyful";

export const WORLD_SLUG_PATTERN = /^[a-z][a-z0-9-]{2,62}$/;

export function validateWorldSlug(slug: string): string | null {
  if (!slug) return "World slug is required.";
  if (!/^[a-z]/.test(slug)) return "Must start with a lowercase letter.";
  if (!/^[a-z0-9-]+$/.test(slug))
    return "Only lowercase letters, digits, and hyphens allowed.";
  if (slug.length < 3) return "Must be at least 3 characters.";
  if (slug.length > 63) return "Must be 63 characters or fewer.";
  return null;
}

export function isWorldSlugTaken(
  slug: string,
  existingSlugs: Set<string>,
): boolean {
  return existingSlugs.has(slug);
}

export function suggestWorldSlug(existingSlugs: Set<string>): string {
  for (let attempt = 0; attempt < 25; attempt++) {
    const candidate = joyful({ pattern: ["color", "science"], maxLength: 40 });
    if (!existingSlugs.has(candidate)) return candidate;
  }
  const short = Math.random().toString(36).slice(2, 8);
  return `world-${short}`;
}
