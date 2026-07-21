import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TokenSecretCard({
  token,
  showSecret,
  maskedLength,
  onToggle,
  onDismiss,
}: {
  token: string;
  showSecret: boolean;
  maskedLength: number;
  onToggle: () => void;
  onDismiss: () => void;
}) {
  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle className="text-sm">New Token Created</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Copy this token now. <strong>It will not be shown again.</strong>
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-md bg-secondary px-3 py-2 text-sm font-mono break-all">
            {showSecret ? token : "•".repeat(maskedLength)}
          </code>
          <Button
            variant="ghost"
            size="icon"
            aria-label={showSecret ? "Hide token" : "Show token"}
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
          Dismiss
        </Button>
      </CardContent>
    </Card>
  );
}
