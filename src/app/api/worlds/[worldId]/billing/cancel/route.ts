import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchUser, getApiBaseUrl, tokenCookieName } from "@/lib/server-auth";

interface RouteContext {
  params: Promise<{ worldId: string }>;
}

export async function POST(_request: Request, { params }: RouteContext) {
  const { worldId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(tokenCookieName)?.value;
  if (!token) {
    return NextResponse.json(
      { error: { message: "Not signed in." } },
      { status: 401 },
    );
  }

  const user = await fetchUser(token);
  if (!user) {
    return NextResponse.json(
      { error: { message: "Session expired." } },
      { status: 401 },
    );
  }

  const response = await fetch(
    `${getApiBaseUrl()}/v1/worlds/${encodeURIComponent(worldId)}/billing/cancel?email=${encodeURIComponent(user.email)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  const body = (await response.json().catch(() => ({}))) as {
    billing?: unknown;
    error?: { message?: string };
  };

  if (!response.ok) {
    return NextResponse.json(
      {
        error: {
          message:
            body.error?.message ??
            "Could not cancel the subscription. Please try again.",
        },
      },
      { status: response.status },
    );
  }

  return NextResponse.json({ billing: body.billing });
}
