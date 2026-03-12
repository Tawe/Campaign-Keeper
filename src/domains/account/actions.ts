"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/auth/actions";
import { deletePortrait } from "@/lib/storage/s3";
import {
  ATTENDANCE_COL,
  CALENDARS_COL,
  CAMPAIGN_EVENTS_COL,
  CAMPAIGN_FACTIONS_COL,
  CAMPAIGN_LOCATIONS_COL,
  CAMPAIGN_NPCS_COL,
  CAMPAIGNS_COL,
  EVENTS_COL,
  FACTIONS_COL,
  LOCATIONS_COL,
  LOCATION_VISITS_COL,
  NPC_MENTIONS_COL,
  NPCS_COL,
  PLAYERS_COL,
  POLL_RESPONSES_COL,
  SCHEDULED_SESSIONS_COL,
  SESSIONS_COL,
  THREADS_COL,
} from "@/lib/firebase/db";

const BATCH_SIZE = 400;

async function deleteByUserId(collectionName: string, uid: string) {
  const db = adminDb();
  const snap = await db.collection(collectionName).where("userId", "==", uid).get();
  for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    snap.docs.slice(i, i + BATCH_SIZE).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

export async function deleteAccount() {
  const user = await requireUser();
  const uid = user.uid;
  const db = adminDb();

  // Collect image paths and campaign IDs before any deletion
  const [npcsSnap, locationsSnap, factionsSnap, eventsSnap, playersSnap, campaignsSnap] =
    await Promise.all([
      db.collection(NPCS_COL).where("userId", "==", uid).get(),
      db.collection(LOCATIONS_COL).where("userId", "==", uid).get(),
      db.collection(FACTIONS_COL).where("userId", "==", uid).get(),
      db.collection(EVENTS_COL).where("userId", "==", uid).get(),
      db.collection(PLAYERS_COL).where("userId", "==", uid).get(),
      db.collection(CAMPAIGNS_COL).where("userId", "==", uid).get(),
    ]);

  const imagePaths: string[] = [
    ...npcsSnap.docs.map((d) => d.data().portraitPath as string | null),
    ...locationsSnap.docs.map((d) => d.data().imagePath as string | null),
    ...factionsSnap.docs.map((d) => d.data().imagePath as string | null),
    ...eventsSnap.docs.map((d) => d.data().imagePath as string | null),
    ...playersSnap.docs.flatMap((d) => {
      const data = d.data();
      const paths: (string | null)[] = [data.portraitPath ?? null];
      (data.characters ?? []).forEach((c: { portraitPath?: string | null }) => {
        if (c.portraitPath) paths.push(c.portraitPath);
      });
      return paths;
    }),
  ].filter((p): p is string => !!p);

  const campaignIds = campaignsSnap.docs.map((d) => d.id);

  // Delete all userId-indexed collections
  await Promise.all(
    [
      CAMPAIGNS_COL, SESSIONS_COL, THREADS_COL, PLAYERS_COL,
      NPCS_COL, CAMPAIGN_NPCS_COL, NPC_MENTIONS_COL,
      LOCATIONS_COL, CAMPAIGN_LOCATIONS_COL, LOCATION_VISITS_COL,
      FACTIONS_COL, CAMPAIGN_FACTIONS_COL,
      EVENTS_COL, CAMPAIGN_EVENTS_COL,
      CALENDARS_COL, SCHEDULED_SESSIONS_COL, ATTENDANCE_COL,
    ].map((col) => deleteByUserId(col, uid)),
  );

  // Delete poll_responses by campaignId (no userId field on these docs)
  for (let i = 0; i < campaignIds.length; i += 30) {
    const chunk = campaignIds.slice(i, i + 30);
    const snap = await db.collection(POLL_RESPONSES_COL).where("campaignId", "in", chunk).get();
    if (!snap.empty) {
      const batch = db.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  // Unlink this user from player records in other DMs' campaigns
  const linkedSnap = await db.collection(PLAYERS_COL).where("playerUserId", "==", uid).get();
  if (!linkedSnap.empty) {
    const batch = db.batch();
    linkedSnap.docs.forEach((d) =>
      batch.update(d.ref, { playerUserId: null, playerEmail: null }),
    );
    await batch.commit();
  }

  // Delete Firebase Auth account (revokes all active sessions)
  await adminAuth().deleteUser(uid);

  // Clear the session cookie
  const cookieStore = await cookies();
  cookieStore.delete("session");

  // Best-effort S3 image cleanup
  await Promise.allSettled(imagePaths.map(deletePortrait));

  redirect("/");
}
