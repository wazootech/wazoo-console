import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchUser, tokenCookieName } from "@/lib/server-auth";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json(
        { error: { message: "Token is required." } },
        { status: 400 },
      );
    }

    const user = await fetchUser(token);
    if (!user) {
      return NextResponse.json(
        { error: { message: "Invalid token or unable to fetch user profile." } },
        { status: 401 },
      );
    }

    (await cookies()).set(tokenCookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return NextResponse.json({ ok: true, user });
  } catch (err) {
    return NextResponse.json(
      { error: { message: err instanceof Error ? err.message : "Internal server error" } },
      { status: 500 },
    );
  }
}
