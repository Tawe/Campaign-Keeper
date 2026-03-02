import { NextRequest, NextResponse } from "next/server";
import { isAuthBypassEnabled } from "@/lib/auth/env";

const SESSION_COOKIE_NAME = "session";

export async function middleware(request: NextRequest) {
  if (isAuthBypassEnabled()) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie && !request.nextUrl.pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|share/|api/session|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
