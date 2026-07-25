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
  onError: async ({ error }) => {
    console.error("[AuthKit callback error]", error);
    const errObj = error as Record<string, unknown> | null | undefined;
    return new Response(
      JSON.stringify(
        {
          error: "AuthKit Callback Error",
          message: error instanceof Error ? error.message : String(error),
          name: error instanceof Error ? error.name : undefined,
          code: (errObj as { code?: unknown })?.code,
          status:
            (errObj as { status?: unknown; statusCode?: unknown })?.status ??
            (errObj as { status?: unknown; statusCode?: unknown })?.statusCode,
          rawData:
            (errObj as { rawData?: unknown; response?: unknown })?.rawData ??
            (errObj as { rawData?: unknown; response?: unknown })?.response ??
            null,
          stack: error instanceof Error ? error.stack : undefined,
        },
        null,
        2,
      ),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  },
});
