import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { MAPS_COL } from "@/lib/firebase/db";
import { getSessionUser } from "@/lib/firebase/session";
import { deletePortrait, saveImageBuffer } from "@/lib/storage/s3";

function mapPaths(campaignId: string | null, mapId: string, locationId: string | null) {
  const paths = [
    "/app/maps",
    `/app/maps/${mapId}`,
  ];

  if (campaignId) {
    paths.push(`/campaigns/${campaignId}/maps`);
    paths.push(`/campaigns/${campaignId}/maps/${mapId}`);
    paths.push(`/player/campaigns/${campaignId}/maps`);
    paths.push(`/player/campaigns/${campaignId}/maps/${mapId}`);
    if (locationId) {
      paths.push(`/campaigns/${campaignId}/locations/${locationId}`);
      paths.push(`/player/campaigns/${campaignId}/locations/${locationId}`);
    }
  }

  return paths;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ mapId: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mapId } = await context.params;
  const mapRef = adminDb().collection(MAPS_COL).doc(mapId);
  const mapDoc = await mapRef.get();
  if (!mapDoc.exists || mapDoc.data()?.userId !== user.uid) {
    return NextResponse.json({ error: "Map not found" }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const campaignIdValue = formData.get("campaignId");
    const campaignId = typeof campaignIdValue === "string" && campaignIdValue.trim() ? campaignIdValue : null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing image file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || "image/jpeg";
    const currentPath = (mapDoc.data()?.imagePath as string | null) ?? null;
    const imagePath = await saveImageBuffer("map", mapId, buffer, contentType);

    await mapRef.update({
      imagePath,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await deletePortrait(currentPath);

    for (const path of mapPaths(campaignId, mapId, (mapDoc.data()?.locationId as string | null) ?? null)) {
      revalidatePath(path);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Upload failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ mapId: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mapId } = await context.params;
  const mapRef = adminDb().collection(MAPS_COL).doc(mapId);
  const mapDoc = await mapRef.get();
  if (!mapDoc.exists || mapDoc.data()?.userId !== user.uid) {
    return NextResponse.json({ error: "Map not found" }, { status: 404 });
  }

  const campaignId = request.nextUrl.searchParams.get("campaignId");
  const currentPath = (mapDoc.data()?.imagePath as string | null) ?? null;

  await mapRef.update({
    imagePath: null,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await deletePortrait(currentPath);

  for (const path of mapPaths(campaignId, mapId, (mapDoc.data()?.locationId as string | null) ?? null)) {
    revalidatePath(path);
  }

  return NextResponse.json({ ok: true });
}
