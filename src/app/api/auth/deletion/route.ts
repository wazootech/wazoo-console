import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchUser, getApiBaseUrl, tokenCookieName } from "@/lib/server-auth";

async function authedToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(tokenCookieName)?.value;
  if (!token) return null;
  const user = await fetchUser(token);
  if (!user) return null;
  return token;
}

export async function POST() {
  const token = await authedToken();
  if (!token) {
    return NextResponse.json(
      { error: { message: "Not signed in." } },
      { status: 401 },
    );
  }

  const response = await fetch(`${getApiBaseUrl()}/v1/users/me/deletion`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const body = (await response.json().catch(() => ({}))) as {
    deletion?: { uid: string; expiresAt: string };
    confirmationToken?: string;
    message?: string;
    error?: { message?: string };
  };

  if (!response.ok) {
    return NextResponse.json(
      {
        error: {
          message:
            body.error?.message ??
            "Could not start account deletion. Please try again.",
        },
      },
      { status: response.status },
    );
  }

  return NextResponse.json(
    {
      deletion: body.deletion,
      confirmationToken: body.confirmationToken,
      message: body.message,
    },
    { status: 201 },
  );
}

export async function DELETE(request: Request) {
  const token = await authedToken();
  if (!token) {
    return NextResponse.json(
      { error: { message: "Not signed in." } },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    confirmationToken?: string;
  };

  if (!body.confirmationToken) {
    return NextResponse.json(
      { error: { message: "Confirmation token is required." } },
      { status: 400 },
    );
  }

  const response = await fetch(`${getApiBaseUrl()}/v1/users/me`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ confirmationToken: body.confirmationToken }),
    cache: "no-store",
  });

  if (response.ok) {
    const cookieStore = await cookies();
    cookieStore.delete(tokenCookieName);
    return new Response(null, { status: 204 });
  }

  const errBody = (await response.json().catch(() => ({}))) as {
    error?: { message?: string };
  };
  return NextResponse.json(
    {
      error: {
        message:
          errBody.error?.message ??
          "Could not delete the account. Please try again.",
      },
    },
    { status: response.status },
  );
}
