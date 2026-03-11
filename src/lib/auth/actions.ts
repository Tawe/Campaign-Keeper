"use server";

import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import {
  CAMPAIGNS_COL,
  FACTIONS_COL,
  LOCATIONS_COL,
  NPCS_COL,
  PLAYERS_COL,
  SESSIONS_COL,
  THREADS_COL,
} from "@/lib/firebase/db";
import { getSessionUser } from "@/lib/firebase/session";

const OWNED_COLLECTIONS = {
  campaign: CAMPAIGNS_COL,
  session: SESSIONS_COL,
  thread: THREADS_COL,
  player: PLAYERS_COL,
  npc: NPCS_COL,
  location: LOCATIONS_COL,
  faction: FACTIONS_COL,
} as const;

type OwnedCollectionKey = keyof typeof OWNED_COLLECTIONS;

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireOwnedCampaign(campaignId: string) {
  const user = await requireUser();
  const doc = await adminDb().collection(CAMPAIGNS_COL).doc(campaignId).get();
  if (!doc.exists || doc.data()?.userId !== user.uid) {
    throw new Error("Campaign not found.");
  }
  return { user, doc };
}

export async function requireOwnedDoc(kind: OwnedCollectionKey, id: string) {
  const user = await requireUser();
  const collection = OWNED_COLLECTIONS[kind];
  const doc = await adminDb().collection(collection).doc(id).get();
  if (!doc.exists || doc.data()?.userId !== user.uid) {
    throw new Error(`${kind[0].toUpperCase()}${kind.slice(1)} not found.`);
  }
  return { user, doc };
}
