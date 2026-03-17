"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to send link");
      }

      // Store email so the callback page can complete sign-in
      localStorage.setItem("emailForSignIn", email);
      setSent(true);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to send link");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center space-y-2">
        <p className="text-lg font-medium">Check your email</p>
        <p className="text-muted-foreground text-sm">
          We sent a magic link to <strong>{email}</strong>. Click it to sign
          in.
        </p>
        {process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === "true" && (
          <p className="text-xs text-amber-600 mt-2">
            Running with emulator — find the link at{" "}
            <a
              href="http://localhost:4000/auth"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              localhost:4000/auth
            </a>
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          placeholder="dm@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Sending…" : "Send magic link"}
      </Button>
    </form>
  );
}
