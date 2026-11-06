import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WorldIdentity } from "@/lib/world-identity";

const stateVariant: Record<string, "default" | "secondary" | "destructive"> = {
  ACTIVE: "default",
  SUSPENDED: "secondary",
  DELETED: "destructive",
};

export function WorldInfoCards({ world }: { world: WorldIdentity }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">State</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={stateVariant[world.state] ?? "secondary"}>
            {world.state}
          </Badge>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Region</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{world.region}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Backend</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{world.backend}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Created</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {world.createTime
              ? new Date(world.createTime).toLocaleString()
              : "—"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Updated</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {world.updateTime
              ? new Date(world.updateTime).toLocaleString()
              : "—"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
