import Link from "next/link";
import { ErrorCard } from "@/components/error-card";

export function WorldTokenErrorCard({ worldId }: { worldId: string }) {
  return (
    <ErrorCard
      message="The selected token isn't recognized by this World. Create a real token on the Tokens page, then select it here."
      action={
        <Link
          href={`/worlds/${worldId}/tokens`}
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Create a real token
        </Link>
      }
    />
  );
}
