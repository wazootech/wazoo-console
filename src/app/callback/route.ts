import { handleAuth } from "@workos-inc/authkit-nextjs";
import { cookies } from "next/headers";
import {
  ageCookieName,
  getDisplayName,
  mintPlatformToken,
  tokenCookieName,
} from "@/lib/server-auth";

export const GET = handleAuth({
  returnPathname: "/worlds",
  onSuccess: async ({ user }) => {
    const cookieStore = await cookies();
    const ageConfirmed = cookieStore.get(ageCookieName)?.value === "1";
    const token = await mintPlatformToken({
      email: user.email,
      displayName: getDisplayName({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }),
      ageConfirmed,
    });

    if (ageConfirmed) {
      cookieStore.delete(ageCookieName);
    }

    (await cookies()).set(tokenCookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
  },
  onError: async ({ error }) => {
    const errObj = error as { code?: string } | null | undefined;
    if (errObj?.code === "AGE_GATE_REQUIRED") {
      return new Response(null, {
        status: 303,
        headers: { Location: "/sign-in" },
      });
    }

    console.error("[AuthKit callback error]", error);
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
