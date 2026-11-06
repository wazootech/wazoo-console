import Link from "next/link";

export function NoTokensNotice({ worldId }: { worldId: string }) {
  return (
    <div className="p-3 border border-dashed border-amber-900/50 rounded bg-amber-950/10 text-amber-500 text-xs">
      No access tokens found for this World in your browser&apos;s local
      storage. Go to the{" "}
      <Link
        href={`/worlds/${worldId}/tokens`}
        className="underline font-semibold hover:text-amber-400"
      >
        Tokens page
      </Link>{" "}
      to generate one first, then select &quot;+ Import existing token&quot;
      above.
    </div>
  );
}
