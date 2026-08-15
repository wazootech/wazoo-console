import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { ageCookieName } from "@/lib/server-auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    ageConfirmed?: unknown;
  };

  if (body.ageConfirmed !== true) {
    return NextResponse.json(
      {
        error: {
          code: "AGE_GATE_REQUIRED",
          message:
            "You must confirm that you are at least 13 years old to use Wazoo.",
        },
      },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(ageCookieName, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  const url = await getSignInUrl();
  return NextResponse.json({ url });
}
