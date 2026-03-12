import Link from "next/link";
import { redirect } from "next/navigation";
import { Calendar } from "lucide-react";
import { getSessionUser } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { PLAYERS_COL } from "@/lib/firebase/db";
import { getCampaignSessions } from "@/domains/sessions/queries";
import { getNextScheduledSession } from "@/domains/schedule/queries";
import { PlayerProfileEditor } from "@/domains/players/components/PlayerProfileEditor";
import { Separator } from "@/components/ui/separator";
import { formatDateShort } from "@/lib/utils";
import type { CharacterInput } from "@/domains/players/actions";

export default async function PlayerCampaignPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [playerSnap, sessions, nextSession] = await Promise.all([
    adminDb()
      .collection(PLAYERS_COL)
      .where("campaignId", "==", campaignId)
      .where("playerUserId", "==", user.uid)
      .limit(1)
      .get(),
    getCampaignSessions(campaignId),
    getNextScheduledSession(campaignId),
  ]);

  if (playerSnap.empty) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Player record not found. Try rejoining via the invite link.
      </p>
    );
  }

  const playerDoc = playerSnap.docs[0];
  const data = playerDoc.data();
  const playerName = (data.name as string) ?? "";
  const characters = ((data.characters ?? []) as {
    charId?: string;
    name: string;
    class: string | null;
    race: string | null;
    level: number | null;
    statsLink: string | null;
    portraitPath?: string | null;
  }[]).map<CharacterInput>((c) => ({
    charId: c.charId ?? "",
    name: c.name,
    class: c.class,
    race: c.race,
    level: c.level,
    statsLink: c.statsLink,
    portraitUrl: c.charId && c.portraitPath
      ? `/api/portraits/character/${playerDoc.id}/${c.charId}`
      : null,
  }));

  // Countdown for next session
  let countdownLabel: string | null = null;
  let countdownSub: string | null = null;
  if (nextSession) {
    const today = new Date().toISOString().slice(0, 10);
    const diff = Math.round(
      (new Date(nextSession.date).getTime() - new Date(today).getTime()) / 86_400_000
    );
    countdownLabel =
      diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : `In ${diff} days`;
    const parts = [
      new Date(nextSession.date + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    ];
    if (nextSession.time) parts.push(nextSession.time);
    if (nextSession.title) parts.push(nextSession.title);
    countdownSub = parts.join(" · ");
  }

  const lastSession = sessions[0] ?? null;

  return (
    <div className="space-y-6">
      {nextSession && countdownLabel && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
          <Calendar className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{countdownLabel}</p>
            {countdownSub && (
              <p className="truncate text-xs text-muted-foreground">{countdownSub}</p>
            )}
          </div>
        </div>
      )}

      {lastSession && (
        <div className="rounded-lg border border-border/50 bg-muted/30 px-4 py-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Last Session
            </p>
            <p className="text-xs text-muted-foreground">
              #{sessions.length} · {formatDateShort(lastSession.date)}
            </p>
          </div>
          <p className="font-medium text-foreground">
            {lastSession.title || "Untitled session"}
          </p>
          {lastSession.public_highlights.length > 0 ? (
            <div className="flex gap-2 text-sm text-muted-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
              <span>{lastSession.public_highlights[0]}</span>
            </div>
          ) : (
            <p className="text-sm italic text-muted-foreground">No highlights recorded.</p>
          )}
          <div className="pt-1 text-right">
            <Link
              href={`/player/campaigns/${campaignId}/sessions/${lastSession.id}`}
              className="text-sm text-primary hover:underline"
            >
              Read recap →
            </Link>
          </div>
        </div>
      )}

      <Separator />

      <div>
        <p className="text-sm text-muted-foreground mb-1">
          Update your display name and add your characters. The DM can see your characters in the campaign.
        </p>
      </div>
      <PlayerProfileEditor
        playerId={playerDoc.id}
        initialName={playerName}
        initialCharacters={characters}
      />
    </div>
  );
}
