/**
 * One-time migration: convert old `npcClass: string` + `level: number` fields
 * in the `npcs` collection to the new `npcClass: [{ name, level }]` array format.
 *
 * Run with:  bun run scripts/migrate-npc-classes.ts
 *
 * Safe to run multiple times — docs already in the new format are skipped.
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Load .env.local so FIREBASE_SERVICE_ACCOUNT is available
import { config } from "bun";
await config({ path: ".env.local" });

const isEmulator = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === "true";

if (isEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
  initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID! });
} else {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
const BATCH_SIZE = 400; // Firestore max is 500 ops per batch

const npcsSnap = await db.collection("npcs").get();

let migrated = 0;
let skipped = 0;
let batch = db.batch();
let batchCount = 0;

for (const doc of npcsSnap.docs) {
  const d = doc.data();

  // Already migrated — npcClass is an array
  if (Array.isArray(d.npcClass)) {
    skipped++;
    continue;
  }

  // Build the new array from the old string + level fields
  const newClasses: { name: string; level: number }[] = [];
  if (typeof d.npcClass === "string" && d.npcClass.trim()) {
    newClasses.push({
      name: d.npcClass.trim(),
      level: typeof d.level === "number" ? d.level : 0,
    });
  }
  // If npcClass was null, we write [] — still a valid migration

  batch.update(doc.ref, {
    npcClass: newClasses,
    // Keep level field as-is; it's harmless legacy data
    updatedAt: FieldValue.serverTimestamp(),
  });

  batchCount++;
  migrated++;

  if (batchCount >= BATCH_SIZE) {
    await batch.commit();
    console.log(`  Committed batch of ${batchCount}`);
    batch = db.batch();
    batchCount = 0;
  }
}

if (batchCount > 0) {
  await batch.commit();
}

console.log(`\nDone. Migrated: ${migrated}, Skipped (already array): ${skipped}`);
