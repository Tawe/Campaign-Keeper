import { cookies } from "next/headers";
import { adminAuth } from "./admin";
import { isAuthBypassEnabled } from "@/lib/auth/env";

const SESSION_COOKIE_NAME = "session";

/**
 * Verifies the session cookie and returns the decoded token (user uid, email, etc.)
 * Returns null if cookie is missing or invalid.
 * For use in Server Components and Server Actions.
 */
export async function getSessionUser(): Promise<{ uid: string; email?: string } | null> {
  if (isAuthBypassEnabled()) {
    return { uid: "dev-user", email: "dev@local" };
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const auth = adminAuth();
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}
