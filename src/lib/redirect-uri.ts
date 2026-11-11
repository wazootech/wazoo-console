/**
 * WorkOS callback URL for this request, or undefined to use the build-time
 * NEXT_PUBLIC_WORKOS_REDIRECT_URI.
 *
 * PR preview Workers get a hostname per branch and per version, so a URI baked
 * in at build time cannot match. Only the preview Worker sets
 * WORKOS_REDIRECT_FROM_ORIGIN (see wrangler.preview.jsonc), and the WorkOS
 * staging environment allowlists its workers.dev hostnames with a wildcard.
 */
export function originRedirectUri(requestUrl: string): string | undefined {
  if (process.env.WORKOS_REDIRECT_FROM_ORIGIN !== "true") return undefined;
  return new URL("/callback", requestUrl).href;
}
