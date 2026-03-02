"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireOwnedCampaign, requireUser } from "@/app/actions/_auth";
import { CAMPAIGNS_COL, PLAYERS_COL } from "@/lib/firebase/db";

export async function createCampaign(formData: FormData) {
  const user = await requireUser();

  const name = formData.get("name") as string;
  const system = (formData.get("system") as string) || null;
  const participantsRaw = formData.get("participants") as string;
  const participants = participantsRaw
    ? participantsRaw.split(",").map((p) => p.trim()).filter(Boolean)
    : [];

  const now = FieldValue.serverTimestamp();
  const db = adminDb();

  const ref = await db.collection(CAMPAIGNS_COL).add({
    userId: user.uid,
    name,
    system,
    participants,
    createdAt: now,
    updatedAt: now,
  });

  // Seed a Player doc for each participant so they appear on the Players screen
  await Promise.all(
    participants.map((playerName) =>
      db.collection(PLAYERS_COL).add({
        campaignId: ref.id,
        userId: user.uid,
        name: playerName,
        portraitPath: null,
        portraitUrl: null,
        characters: [],
        createdAt: now,
        updatedAt: now,
      })
    )
  );

  revalidatePath("/");
  redirect(`/campaigns/${ref.id}`);
}

export async function updateCampaign(id: string, formData: FormData) {
  await requireOwnedCampaign(id);

  const name = formData.get("name") as string;
  const system = (formData.get("system") as string) || null;
  const participantsRaw = formData.get("participants") as string;
  const participants = participantsRaw
    ? participantsRaw.split(",").map((p) => p.trim()).filter(Boolean)
    : [];

  await adminDb().collection(CAMPAIGNS_COL).doc(id).update({
    name,
    system,
    participants,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath(`/campaigns/${id}`);
  revalidatePath("/");
}

export async function deleteCampaign(id: string) {
  await requireOwnedCampaign(id);
  await adminDb().collection(CAMPAIGNS_COL).doc(id).delete();
  revalidatePath("/");
  redirect("/");
}
