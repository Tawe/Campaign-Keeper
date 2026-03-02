"use server";

import { revalidatePath } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireOwnedDoc } from "@/app/actions/_auth";
import { THREADS_COL } from "@/lib/firebase/db";

export async function resolveThread(id: string, campaignId: string) {
  const { doc } = await requireOwnedDoc("thread", id);
  const actualCampaignId = doc.data()?.campaignId as string;
  await adminDb().collection(THREADS_COL).doc(id).update({
    status: "resolved",
    resolvedAt: Timestamp.now(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  revalidatePath(`/campaigns/${actualCampaignId || campaignId}`);
}

export async function reopenThread(id: string, campaignId: string) {
  const { doc } = await requireOwnedDoc("thread", id);
  const actualCampaignId = doc.data()?.campaignId as string;
  await adminDb().collection(THREADS_COL).doc(id).update({
    status: "open",
    resolvedAt: null,
    updatedAt: FieldValue.serverTimestamp(),
  });
  revalidatePath(`/campaigns/${actualCampaignId || campaignId}`);
}
