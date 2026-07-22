import { handleAuth } from "@workos-inc/authkit-nextjs";
import { cookies } from "next/headers";
import {
  getDisplayName,
  mintConsoleToken,
  tokenCookieName,
} from "@/lib/server-auth";

export const GET = handleAuth({
  returnPathname: "/worlds",
  onSuccess: async ({ user }) => {
    const token = await mintConsoleToken({
      email: user.email,
      displayName: getDisplayName({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }),
    });

    (await cookies()).set(tokenCookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
  },
});
