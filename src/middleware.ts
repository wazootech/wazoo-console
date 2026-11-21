import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";
import { authkitProxy } from "@workos-inc/authkit-nextjs";
import { originRedirectUri } from "@/lib/redirect-uri";
import { tokenCookieName } from "@/lib/server-auth";

const proxyOptions = {
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: [
      "/sign-in",
      "/callback",
      "/api/auth/bypass",
      "/api/auth/sign-in",
      "/api/health",
    ],
  },
};
const proxy = authkitProxy(proxyOptions);

export default async function middleware(
  request: NextRequest,
  event: NextFetchEvent,
) {
  const hasToken = request.cookies.has(tokenCookieName);
  const pathname = request.nextUrl.pathname;

  if (hasToken) {
    if (pathname === "/login" || pathname === "/sign-in") {
      return NextResponse.redirect(new URL("/worlds", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Preview Workers derive the WorkOS callback from the request origin.
  const redirectUri = originRedirectUri(request.url);
  return redirectUri
    ? authkitProxy({ ...proxyOptions, redirectUri })(request, event)
    : proxy(request, event);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
