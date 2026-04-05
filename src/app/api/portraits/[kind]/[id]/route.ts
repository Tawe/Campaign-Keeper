import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { CAMPAIGNS_COL, EVENTS_COL, FACTIONS_COL, LOCATIONS_COL, MAPS_COL, NPCS_COL, PLAYERS_COL } from "@/lib/firebase/db";
import { getSessionUser } from "@/lib/firebase/session";
import { getPortraitObject } from "@/lib/storage/s3";

const COLLECTIONS = {
  npc: NPCS_COL,
  player: PLAYERS_COL,
  location: LOCATIONS_COL,
  map: MAPS_COL,
  event: EVENTS_COL,
  campaign: CAMPAIGNS_COL,
  faction: FACTIONS_COL,
} as const;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ kind: string; id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { kind, id } = await context.params;
  const collection = COLLECTIONS[kind as keyof typeof COLLECTIONS];
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
    const bytes = Uint8Array.from(Buffer.from(body, "base64"));

    return new NextResponse(
      new Blob([bytes], { type: mimeType }),
      {
        headers: {
          "Content-Type": mimeType,
          "Cache-Control": "private, max-age=3600",
        },
      }
    );
  }

  const indexParam = request.nextUrl.searchParams.get("index");
  const wantsGallery = request.nextUrl.searchParams.get("gallery") === "1";
  const galleryIndex = indexParam ? Number.parseInt(indexParam, 10) : null;
  const galleryPaths = Array.isArray(doc.data()?.galleryPaths)
    ? (doc.data()?.galleryPaths as unknown[])
        .flatMap((entry) => {
          if (typeof entry === "string" && entry.trim().length > 0) return [entry];
          if (!entry || typeof entry !== "object") return [];
          const path = (entry as { path?: unknown }).path;
          return typeof path === "string" && path.trim().length > 0 ? [path] : [];
        })
    : [];

  const portraitPath = wantsGallery && galleryIndex !== null
    ? galleryPaths[galleryIndex]
    : (doc.data()?.portraitPath ?? doc.data()?.imagePath) as string | undefined;
  if (!portraitPath) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const portrait = await getPortraitObject(portraitPath);
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
