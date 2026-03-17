import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { sendLoginEmail } from "@/lib/email/sendLoginLink";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return NextResponse.json({ error: "APP_URL is not configured" }, { status: 500 });
    }

    // Generate the link server-side — does NOT send any email
    const magicLink = await adminAuth().generateSignInWithEmailLink(email.trim(), {
      url: `${appUrl}/auth/callback`,
      handleCodeInApp: true,
    });

    await sendLoginEmail(email.trim(), magicLink);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Magic link error:", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to send sign-in link" },
      { status: 500 },
    );
  }
}
