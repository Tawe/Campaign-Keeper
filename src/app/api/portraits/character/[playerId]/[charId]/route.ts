import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { PLAYERS_COL } from "@/lib/firebase/db";
import { getSessionUser } from "@/lib/firebase/session";
import { getPortraitObject } from "@/lib/storage/s3";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ playerId: string; charId: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { playerId, charId } = await context.params;

  const doc = await adminDb().collection(PLAYERS_COL).doc(playerId).get();
  if (!doc.exists) {
    return new NextResponse("Not found", { status: 404 });
  }

  const data = doc.data()!;
  // Allow DM or the linked player
  if (data.userId !== user.uid && data.playerUserId !== user.uid) {
    return new NextResponse("Not found", { status: 404 });
  }

  const characters = (data.characters ?? []) as { charId?: string; portraitPath?: string | null }[];
  const character = characters.find((c) => c.charId === charId);
  if (!character?.portraitPath) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const portrait = await getPortraitObject(character.portraitPath);
    const bytes = Uint8Array.from(portrait.body);
    return new NextResponse(new Blob([bytes], { type: portrait.contentType }), {
      headers: {
        "Content-Type": portrait.contentType,
        "Cache-Control": portrait.cacheControl,
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
