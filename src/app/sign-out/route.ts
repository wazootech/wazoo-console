import { signOut } from "@workos-inc/authkit-nextjs";
import { cookies } from "next/headers";
import { clearTokenCookies } from "@/lib/session-cookie";

export async function GET(request: Request) {
  const returnTo = new URL("/sign-in", request.url).toString();

  clearTokenCookies(await cookies());

  await signOut({ returnTo });
}
