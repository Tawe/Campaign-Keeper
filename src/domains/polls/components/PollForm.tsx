"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { submitPollResponse } from "@/domains/polls/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface PollFormProps {
  sessionId: string;
  campaignId: string;
}

export function PollForm({ sessionId, campaignId }: PollFormProps) {
  const [startedAt] = useState(() => Date.now());
  const [playerName, setPlayerName] = useState("");
  const [website, setWebsite] = useState("");
  const [enjoyment, setEnjoyment] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [liked, setLiked] = useState("");
  const [improve, setImprove] = useState("");
  const [lookingForward, setLookingForward] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="text-center py-8 space-y-2">
        <p className="text-2xl">🎲</p>
        <p className="font-semibold">Thanks for your feedback!</p>
        <p className="text-sm text-muted-foreground">Your DM will appreciate it.</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (enjoyment === 0) {
      setError("Please select an enjoyment rating.");
      return;
    }
    setError("");
    setLoading(true);
    const result = await submitPollResponse({
      sessionId,
      campaignId,
      playerName: playerName.trim() || null,
      enjoyment,
      liked,
      improve,
      lookingForward,
      website,
      startedAt,
    });
    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error ?? "Something went wrong.");
      setLoading(false);
    }
  }

  const displayRating = hovered || enjoyment;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="hidden" aria-hidden="true">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="playerName">Your name <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Input
          id="playerName"
          placeholder="Gandalf"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
      </div>

      {/* Star rating */}
      <div className="space-y-1.5">
        <Label>How much did you enjoy this session? <span className="text-destructive">*</span></Label>
        <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setEnjoyment(n)}
              onMouseEnter={() => setHovered(n)}
              className="p-0.5 transition-transform hover:scale-110"
              aria-label={`${n} star${n !== 1 ? "s" : ""}`}
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  n <= displayRating
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* Liked */}
      <div className="space-y-1.5">
        <Label htmlFor="liked">What did you like about this session?</Label>
        <Textarea
          id="liked"
          placeholder="The ambush scene was incredibly tense…"
          value={liked}
          onChange={(e) => setLiked(e.target.value)}
          rows={3}
        />
      </div>

      {/* Improve */}
      <div className="space-y-1.5">
        <Label htmlFor="improve">What could be improved?</Label>
        <Textarea
          id="improve"
          placeholder="Would have liked more time to explore the town…"
          value={improve}
          onChange={(e) => setImprove(e.target.value)}
          rows={3}
        />
      </div>

      {/* Looking forward */}
      <div className="space-y-1.5">
        <Label htmlFor="lookingForward">What are you looking forward to?</Label>
        <Textarea
          id="lookingForward"
          placeholder="Finding out who's behind the assassin plot…"
          value={lookingForward}
          onChange={(e) => setLookingForward(e.target.value)}
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Sending…" : "Send feedback"}
      </Button>
    </form>
  );
}
