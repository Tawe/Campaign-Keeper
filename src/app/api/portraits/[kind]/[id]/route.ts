import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { NPCS_COL, PLAYERS_COL } from "@/lib/firebase/db";
import { getSessionUser } from "@/lib/firebase/session";
import { getPortraitObject } from "@/lib/storage/s3";

const COLLECTIONS = {
  npc: NPCS_COL,
  player: PLAYERS_COL,
} as const;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ kind: "npc" | "player"; id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { kind, id } = await context.params;
  const collection = COLLECTIONS[kind];
  if (!collection) {
    return new NextResponse("Not found", { status: 404 });
  }

  const doc = await adminDb().collection(collection).doc(id).get();
  if (!doc.exists || doc.data()?.userId !== user.uid) {
    return new NextResponse("Not found", { status: 404 });
  }

  const legacyPortrait = doc.data()?.portraitUrl as string | undefined;
  if (legacyPortrait?.startsWith("data:")) {
    const [, mimeType = "image/jpeg", body = ""] =
      legacyPortrait.match(/^data:([^;]+);base64,(.+)$/) ?? [];

    return new NextResponse(Buffer.from(body, "base64"), {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  }

  const portraitPath = doc.data()?.portraitPath as string | undefined;
  if (!portraitPath) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const portrait = await getPortraitObject(portraitPath);
    return new NextResponse(portrait.body, {
      headers: {
        "Content-Type": portrait.contentType,
        "Cache-Control": portrait.cacheControl,
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
