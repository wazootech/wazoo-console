import { signOut } from "@workos-inc/authkit-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { tokenCookieName } from "@/lib/server-auth";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(tokenCookieName);

  const url = new URL(request.url);
  const returnTo = `${url.protocol}//${url.host}/sign-in`;

  try {
    await signOut({ returnTo });
  } catch (error) {
    // Fall back to local redirect if WorkOS signOut throws or redirects to WorkOS error
  }

  return NextResponse.redirect(new URL("/sign-in", request.url));
}
