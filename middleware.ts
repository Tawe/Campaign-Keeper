import { NextRequest, NextResponse } from "next/server";
import { isAuthBypassEnabled } from "@/lib/auth/env";

const SESSION_COOKIE_NAME = "session";
const PROTECTED_PREFIXES = ["/campaigns", "/app", "/player"];

export async function middleware(request: NextRequest) {
  if (isAuthBypassEnabled()) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  const requiresAuth = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  if (!requiresAuth) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/session|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
