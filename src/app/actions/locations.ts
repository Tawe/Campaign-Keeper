"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireOwnedDoc } from "@/app/actions/_auth";
import { LOCATIONS_COL } from "@/lib/firebase/db";

export async function updateLocationInfo(
  locationId: string,
  campaignId: string,
  field: "publicInfo" | "privateNotes",
  value: string,
) {
  const { doc } = await requireOwnedDoc("location", locationId);
  const db = adminDb();
  const actualCampaignId = (doc.data()?.campaignId as string) || campaignId;

  await db.collection(LOCATIONS_COL).doc(locationId).update({
    [field]: value.trim() || null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath(`/campaigns/${actualCampaignId}/locations/${locationId}`);
  revalidatePath(`/campaigns/${actualCampaignId}/locations`);
}
