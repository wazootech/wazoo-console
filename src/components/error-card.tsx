import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ErrorCard({
  message,
  action,
}: {
  message: string;
  action?: ReactNode;
}) {
  return (
    <Card className="border-destructive">
      <CardContent className="flex items-center gap-3 py-4">
        <AlertCircle className="size-5 text-destructive shrink-0" />
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
        {action ? <div className="ml-auto">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
