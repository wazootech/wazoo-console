import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";
import { authkitProxy } from "@workos-inc/authkit-nextjs";
import { tokenCookieName } from "@/lib/server-auth";

const proxy = authkitProxy({
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: ["/login", "/sign-in", "/callback", "/api/auth/bypass"],
  },
});

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  const hasToken = request.cookies.has(tokenCookieName);
  const pathname = request.nextUrl.pathname;

  if (hasToken) {
    if (pathname === "/login" || pathname === "/sign-in") {
      return NextResponse.redirect(new URL("/worlds", request.url));
    }
    return NextResponse.next();
  }

  return proxy(request, event);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
