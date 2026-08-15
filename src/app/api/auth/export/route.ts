import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchUser, getApiBaseUrl, tokenCookieName } from "@/lib/server-auth";

export async function GET() {
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

  const response = await fetch(`${getApiBaseUrl()}/v1/users/me/export`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    return NextResponse.json(
      {
        error: {
          message:
            body.error?.message ??
            "Could not export account data. Please try again.",
        },
      },
      { status: response.status },
    );
  }

  const data = await response.text();
  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="wazoo-data-${user.uid}.json"`,
    },
  });
}
