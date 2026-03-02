"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireOwnedDoc } from "@/app/actions/_auth";
import { NPCS_COL } from "@/lib/firebase/db";
import { deletePortrait, savePortraitDataUrl } from "@/lib/storage/s3";

export async function updateNpcInfo(
  npcId: string,
  campaignId: string,
  field: "publicInfo" | "privateNotes" | "status" | "lastScene" | "statsLink" | "portraitUrl",
  value: string,
) {
  const { doc } = await requireOwnedDoc("npc", npcId);
  const db = adminDb();
  const actualCampaignId = (doc.data()?.campaignId as string) || campaignId;

  if (field === "portraitUrl") {
    const previousPortraitPath = (doc.data()?.portraitPath as string | null) ?? null;
    let nextPortraitPath = previousPortraitPath;

    if (value.startsWith("data:")) {
      nextPortraitPath = await savePortraitDataUrl("npc", npcId, value);
      await deletePortrait(previousPortraitPath);
    } else if (!value.trim()) {
      nextPortraitPath = null;
      await deletePortrait(previousPortraitPath);
    }

    await db.collection(NPCS_COL).doc(npcId).update({
      portraitPath: nextPortraitPath,
      portraitUrl: null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath(`/campaigns/${actualCampaignId}/npcs/${npcId}`);
    revalidatePath(`/campaigns/${actualCampaignId}/npcs`);
    return;
  }

  await db.collection(NPCS_COL).doc(npcId).update({
    [field]: value.trim() || null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath(`/campaigns/${actualCampaignId}/npcs/${npcId}`);
  revalidatePath(`/campaigns/${actualCampaignId}/npcs`);
}
