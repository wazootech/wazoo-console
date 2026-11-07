import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Loader2 } from "lucide-react";
import { useGT } from "gt-next";

interface YourDataCardProps {
  hasClient: boolean;
  exporting: boolean;
  exportError: string | null;
  onExport: () => void;
  onDelete: () => void;
}

export function YourDataCard({
  hasClient,
  exporting,
  exportError,
  onExport,
  onDelete,
}: YourDataCardProps) {
  const gt = useGT();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{gt("Your data")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            {gt(
              "Export a copy of the data Wazoo holds on your account, or permanently delete the account and its data.",
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={onExport}
              disabled={exporting || !hasClient}
            >
              {exporting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {gt("Export my data")}
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={!hasClient}
            >
              <Trash2 className="size-4" />
              {gt("Delete account")}
            </Button>
          </div>
          {exportError ? (
            <p role="alert" className="text-sm text-destructive mt-3">
              {exportError}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
