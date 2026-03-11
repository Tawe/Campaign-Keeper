"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireOwnedCampaign, requireUser } from "@/lib/auth/actions";
import { CALENDARS_COL } from "@/lib/firebase/db";
import type { CalendarMonth } from "@/types";

export async function saveCalendar(
  campaignId: string,
  input: {
    name: string;
    yearLabel: string;
    startYear: number | null;
    months: CalendarMonth[];
    weekdays: string[];
  },
) {
  const user = await requireUser();
  await requireOwnedCampaign(campaignId);

  const name = input.name.trim();
  if (!name) throw new Error("Calendar name is required.");
  if (input.months.length === 0) throw new Error("At least one month is required.");
  if (input.months.some((m) => !m.name.trim())) throw new Error("All months must have a name.");
  if (input.months.some((m) => m.days < 1)) throw new Error("Each month must have at least 1 day.");
  if (input.weekdays.length === 0) throw new Error("At least one weekday is required.");

  const db = adminDb();
  const now = FieldValue.serverTimestamp();

  const docRef = db.collection(CALENDARS_COL).doc(campaignId);
  const existing = await docRef.get();

  await docRef.set({
    campaignId,
    userId: user.uid,
    name,
    yearLabel: input.yearLabel.trim(),
    ...(input.startYear !== null && { startYear: input.startYear }),
    months: input.months.map((m) => ({ name: m.name.trim(), days: m.days })),
    weekdays: input.weekdays.map((w) => w.trim()).filter(Boolean),
    updatedAt: now,
    createdAt: existing.exists ? existing.data()!.createdAt : now,
  });

  revalidatePath(`/campaigns/${campaignId}/calendar`);
}

export async function importCalendarFromCampaign(
  targetCampaignId: string,
  sourceCampaignId: string,
) {
  const user = await requireUser();
  await requireOwnedCampaign(targetCampaignId);
  await requireOwnedCampaign(sourceCampaignId);

  const db = adminDb();
  const sourceDoc = await db.collection(CALENDARS_COL).doc(sourceCampaignId).get();
  if (!sourceDoc.exists) throw new Error("Source campaign has no calendar.");

  const s = sourceDoc.data()!;
  const now = FieldValue.serverTimestamp();

  const targetRef = db.collection(CALENDARS_COL).doc(targetCampaignId);
  const existing = await targetRef.get();

  await targetRef.set({
    campaignId: targetCampaignId,
    userId: user.uid,
    name: s.name,
    yearLabel: s.yearLabel,
    months: s.months,
    weekdays: s.weekdays,
    updatedAt: now,
    createdAt: existing.exists ? existing.data()!.createdAt : now,
  });

  revalidatePath(`/campaigns/${targetCampaignId}/calendar`);
}
