import Link from "next/link";
import { useGT } from "gt-next";

export function NoTokensNotice({ worldId }: { worldId: string }) {
  const gt = useGT();
  return (
    <div className="p-3 border border-dashed border-amber-900/50 rounded bg-amber-950/10 text-amber-500 text-xs">
      {gt(
        "No access tokens found for this World in your browser's local storage. Go to the",
      )}{" "}
      <Link
        href={`/worlds/${worldId}/tokens`}
        className="underline font-semibold hover:text-amber-400"
      >
        {gt("Tokens page")}
      </Link>{" "}
      {gt(
        "to generate one first, then select '+ Import existing token' above.",
      )}
    </div>
  );
}
