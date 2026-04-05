import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "session";
// 5 days in ms (Firebase max is 14 days)
const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

function normalizeOrigin(value: string | undefined | null) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isAllowedOrigin(request: NextRequest) {
  const requestOrigin = normalizeOrigin(request.headers.get("origin"));
  if (!requestOrigin) return true;

  const allowed = new Set<string>();
  const candidates = [
    request.nextUrl.origin,
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeOrigin(candidate);
    if (normalized) allowed.add(normalized);
  }

  return allowed.has(requestOrigin);
}

export async function POST(request: NextRequest) {
  try {
    if (!isAllowedOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const auth = adminAuth();
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION_MS / 1000,
      path: "/",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Session creation failed:", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
