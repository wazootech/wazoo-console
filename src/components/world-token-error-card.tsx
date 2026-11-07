import Link from "next/link";
import { ErrorCard } from "@/components/error-card";
import { useGT } from "gt-next";

export function WorldTokenErrorCard({ worldId }: { worldId: string }) {
  const gt = useGT();
  return (
    <ErrorCard
      message={gt(
        "The selected token isn't recognized by this World. Create a real token on the Tokens page, then select it here.",
        {
          $context:
            "World detail page: the token saved for this world is not a valid API token",
        },
      )}
      action={
        <Link
          href={`/worlds/${worldId}/tokens`}
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
        >
          {gt("Create a real token")}
        </Link>
      }
    />
  );
}
