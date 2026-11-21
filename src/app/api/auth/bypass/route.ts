import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchUser } from "@/lib/server-auth";
import { setTokenCookie } from "@/lib/session-cookie";

export async function POST(request: Request) {
  if (process.env.E2E_AUTH_BYPASS_ENABLED !== "true") {
    return NextResponse.json(
      { error: { message: "Not found." } },
      { status: 404 },
    );
  }

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
        {
          error: { message: "Invalid token or unable to fetch user profile." },
        },
        { status: 401 },
      );
    }

    setTokenCookie(await cookies(), token);

    return NextResponse.json({ ok: true, user });
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          message: err instanceof Error ? err.message : "Internal server error",
        },
      },
      { status: 500 },
    );
  }
}
