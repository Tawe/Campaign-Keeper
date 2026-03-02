"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/app";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function completeSignIn() {
      const auth = getFirebaseAuth();
      if (!isSignInWithEmailLink(auth, window.location.href)) {
        setError("Invalid sign-in link.");
        return;
      }

      let email = localStorage.getItem("emailForSignIn");
      if (!email) {
        // Fallback: prompt user (shouldn't happen in normal flow)
        email = window.prompt("Please enter your email to confirm sign-in:");
        if (!email) {
          setError("Email is required to complete sign-in.");
          return;
        }
      }

      try {
        const credential = await signInWithEmailLink(
          auth,
          email,
          window.location.href
        );
        localStorage.removeItem("emailForSignIn");

        const idToken = await credential.user.getIdToken();

        const res = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });

        if (!res.ok) throw new Error("Failed to create session");

        router.replace("/");
      } catch (err: unknown) {
        setError((err as { message?: string }).message ?? "Sign-in failed");
      }
    }

    completeSignIn();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-destructive font-medium">Sign-in failed</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <a href="/auth/login" className="text-sm underline">
            Try again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Signing you in…</p>
    </div>
  );
}
