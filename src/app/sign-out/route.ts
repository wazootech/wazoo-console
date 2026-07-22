import { signOut } from "@workos-inc/authkit-nextjs";
import { cookies } from "next/headers";
import { tokenCookieName } from "@/lib/server-auth";

export async function GET() {
  (await cookies()).delete(tokenCookieName);
  await signOut();
}
