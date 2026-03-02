"use server";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { SESSIONS_COL, POLL_RESPONSES_COL } from "@/lib/firebase/db";

export interface SubmitPollInput {
  sessionId: string;
  campaignId: string;
  playerName: string | null;
  enjoyment: number;
  liked: string;
  improve: string;
  lookingForward: string;
  website?: string;
  startedAt?: number;
}

export async function submitPollResponse(
  input: SubmitPollInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = adminDb();
    const normalizedPlayerName = input.playerName?.trim().toLowerCase() || null;
    const honeypot = input.website?.trim();

    if (honeypot) {
      return { success: true };
    }

    if (
      typeof input.startedAt !== "number" ||
      !Number.isFinite(input.startedAt) ||
      Date.now() - input.startedAt < 1500 ||
      Date.now() - input.startedAt > 12 * 60 * 60 * 1000
    ) {
      return { success: false, error: "Unable to submit feedback right now. Please try again." };
    }

    // Verify session exists
    const sessionDoc = await db.collection(SESSIONS_COL).doc(input.sessionId).get();
    if (!sessionDoc.exists) {
      return { success: false, error: "Session not found." };
    }
    const sessionCampaignId = sessionDoc.data()?.campaignId as string | undefined;
    if (!sessionCampaignId || sessionCampaignId !== input.campaignId) {
      return { success: false, error: "Invalid campaign/session combination." };
    }

    if (input.enjoyment < 1 || input.enjoyment > 5) {
      return { success: false, error: "Enjoyment rating must be between 1 and 5." };
    }

    if (
      (input.playerName?.length ?? 0) > 100 ||
      input.liked.length > 2000 ||
      input.improve.length > 2000 ||
      input.lookingForward.length > 2000
    ) {
      return { success: false, error: "Feedback is too long." };
    }

    const recentSnap = await db
      .collection(POLL_RESPONSES_COL)
      .where("sessionId", "==", input.sessionId)
      .limit(100)
      .get();

    const now = Date.now();
    const burstWindowMs = 10 * 60 * 1000;
    const duplicateWindowMs = 60 * 60 * 1000;
    const fingerprint = JSON.stringify({
      enjoyment: input.enjoyment,
      liked: input.liked.trim(),
      improve: input.improve.trim(),
      lookingForward: input.lookingForward.trim(),
    });

    let recentCount = 0;
    for (const doc of recentSnap.docs) {
      const data = doc.data();
      const createdAt = (data.createdAt as Timestamp | undefined)?.toDate?.().getTime?.() ?? 0;
      const playerNameLower = (data.playerNameLower as string | undefined) ?? null;

      if (createdAt && now - createdAt <= burstWindowMs) {
        recentCount += 1;
      }

      if (normalizedPlayerName && playerNameLower === normalizedPlayerName) {
        return { success: false, error: "A response from that player has already been submitted." };
      }

      const existingFingerprint = JSON.stringify({
        enjoyment: data.enjoyment,
        liked: (data.liked as string | undefined) ?? "",
        improve: (data.improve as string | undefined) ?? "",
        lookingForward: (data.lookingForward as string | undefined) ?? "",
      });

      if (createdAt && now - createdAt <= duplicateWindowMs && existingFingerprint === fingerprint) {
        return { success: false, error: "That feedback was already submitted recently." };
      }
    }

    if (recentCount >= 20) {
      return { success: false, error: "Too many responses right now. Please try again shortly." };
    }

    await db.collection(POLL_RESPONSES_COL).add({
      sessionId: input.sessionId,
      campaignId: sessionCampaignId,
      playerName: input.playerName?.trim() || null,
      playerNameLower: normalizedPlayerName,
      enjoyment: input.enjoyment,
      liked: input.liked.trim(),
      improve: input.improve.trim(),
      lookingForward: input.lookingForward.trim(),
      createdAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch {
    return { success: false, error: "Failed to submit feedback. Please try again." };
  }
}
