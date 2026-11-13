import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGT } from "gt-next";

export function TokenSecretCard({
  token,
  saveFailed,
  showSecret,
  maskedLength,
  onToggle,
  onDismiss,
}: {
  token: string;
  saveFailed?: boolean;
  showSecret: boolean;
  maskedLength: number;
  onToggle: () => void;
  onDismiss: () => void;
}) {
  const gt = useGT();
  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle className="text-sm">{gt("New Token Created")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {saveFailed && (
          <p role="alert" className="text-sm text-destructive">
            {gt("Could not save the token in this browser.")}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {gt("Copy this token now.")}{" "}
          <strong>{gt("It will not be shown again.")}</strong>
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-md bg-secondary px-3 py-2 text-sm font-mono break-all">
            {showSecret ? token : "•".repeat(maskedLength)}
          </code>
          <Button
            variant="ghost"
            size="icon"
            aria-label={showSecret ? gt("Hide token") : gt("Show token")}
            aria-pressed={showSecret}
            onClick={onToggle}
          >
            {showSecret ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={onDismiss}>
          {gt("Dismiss")}
        </Button>
      </CardContent>
    </Card>
  );
}
