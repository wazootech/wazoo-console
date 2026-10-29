import { getWorldsApiUrl } from "@/lib/utils";

export async function postImport(
  worldId: string,
  token: string,
  payload: string,
  payloadType: string,
): Promise<{ quads: number; chunks: number }> {
  const endpoint = `${getWorldsApiUrl()}/worlds/${encodeURIComponent(worldId)}/import`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      data: payload,
      contentType: payloadType,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Failed to import graph data");
  }
  return {
    quads: data.imported?.quads || 0,
    chunks: data.imported?.chunks || 0,
  };
}
