"use client";

export const dynamic = "force-dynamic";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getMagicLinkErrorMessage,
  normalizeMagicLinkEmail,
  shouldPromptForMagicLinkEmail,
} from "@/lib/auth/emailLink";
import { getFirebaseAuth } from "@/lib/firebase/app";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsEmail, setNeedsEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function finalizeSignIn(rawEmail: string) {
    const auth = getFirebaseAuth();
    const normalizedEmail = normalizeMagicLinkEmail(rawEmail);

    if (!isSignInWithEmailLink(auth, window.location.href)) {
      setError("Invalid sign-in link.");
      return;
    }

    if (!normalizedEmail) {
      setNeedsEmail(true);
      setError("Email is required to complete sign-in.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const credential = await signInWithEmailLink(
        auth,
        normalizedEmail,
        window.location.href
      ).catch((err) => {
        throw new Error(
          err?.code ? `${err.message} (${err.code})` : err?.message ?? "Sign-in failed"
        );
      });

      localStorage.removeItem("emailForSignIn");

      const idToken = await credential.user.getIdToken();
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) throw new Error("Failed to create session");

      const joinCampaignId = localStorage.getItem("joinCampaignId");
      const joinToken = localStorage.getItem("joinToken");
      if (joinCampaignId && joinToken) {
        localStorage.removeItem("joinCampaignId");
        localStorage.removeItem("joinToken");
        router.replace(`/join/${joinCampaignId}?token=${joinToken}`);
        return;
      }

      router.replace("/app/dashboard");
    } catch (err: unknown) {
      setError(getMagicLinkErrorMessage(err));
      setNeedsEmail(shouldPromptForMagicLinkEmail(err));
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!isSignInWithEmailLink(auth, window.location.href)) {
      setError("Invalid sign-in link.");
      return;
    }

    const storedEmail = normalizeMagicLinkEmail(
      localStorage.getItem("emailForSignIn") ?? ""
    );

    if (!storedEmail) {
      setNeedsEmail(true);
      return;
    }

    void finalizeSignIn(storedEmail);
  }, []);

  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = normalizeMagicLinkEmail(email);
    localStorage.setItem("emailForSignIn", normalizedEmail);
    void finalizeSignIn(normalizedEmail);
  }

  if (needsEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center space-y-2">
            <p className="font-medium">Confirm your email</p>
            <p className="text-sm text-muted-foreground">
              Enter the same email address you used when requesting this magic link.
            </p>
          </div>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoFocus
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing you in…" : "Complete sign-in"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-destructive font-medium">Sign-in failed</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <a href="/login" className="text-sm underline">
            Try again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">
        {submitting ? "Signing you in…" : "Checking your sign-in link…"}
      </p>
    </div>
  );
}
