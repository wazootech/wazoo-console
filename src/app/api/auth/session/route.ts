import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { User } from "@wazoo/client";
import { fetchUser, tokenCookieName } from "@/lib/server-auth";

type SessionResponse = {
  token: string;
  user: User;
};

export async function GET(): Promise<NextResponse<SessionResponse | unknown>> {
  const cookieStore = await cookies();
  const storedToken = cookieStore.get(tokenCookieName)?.value;
  if (!storedToken) {
    return NextResponse.json(
      { error: { message: "Not signed in." } },
      { status: 401 },
    );
  }

  const user = await fetchUser(storedToken);
  if (!user) {
    cookieStore.delete(tokenCookieName);
    return NextResponse.json(
      { error: { message: "Session expired." } },
      { status: 401 },
    );
  }

  return NextResponse.json({ token: storedToken, user });
}
