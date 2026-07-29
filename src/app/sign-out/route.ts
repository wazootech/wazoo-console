import { signOut } from "@workos-inc/authkit-nextjs";
import { cookies } from "next/headers";
import { tokenCookieName } from "@/lib/server-auth";

export async function GET(request: Request) {
  const returnTo = new URL("/sign-in", request.url).toString();

  const nextCookies = await cookies();
  nextCookies.delete(tokenCookieName);

  await signOut({ returnTo });
}
