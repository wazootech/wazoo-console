import { Button } from "@/components/ui/button";
import { useGT } from "gt-next";

export function CreatedWorldView({
  worldId,
  onDone,
}: {
  worldId: string;
  onDone: () => void;
}) {
  const gt = useGT();
  return (
    <div className="space-y-4">
      <p role="status">{gt("World created successfully.")}</p>
      <div className="space-y-2">
        <p className="text-sm font-medium">{gt("World ID")}</p>
        <code className="block break-all rounded-md border bg-muted p-3 text-sm">
          {worldId}
        </code>
      </div>
      <div className="flex justify-end">
        <Button type="button" onClick={onDone}>
          {gt("Done")}
        </Button>
      </div>
    </div>
  );
}
