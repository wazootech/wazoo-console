import { signOut } from "@workos-inc/authkit-nextjs";
import { cookies } from "next/headers";
import { tokenCookieName } from "@/lib/server-auth";

export async function GET(request: Request) {
  (await cookies()).delete(tokenCookieName);
  const url = new URL(request.url);
  const returnTo = `${url.protocol}//${url.host}/login`;
  await signOut({ returnTo });
}
