import { adminDb } from "@/lib/firebase/admin";
import { toCalendar, toCampaign } from "@/lib/firebase/converters";
import { CALENDARS_COL, CAMPAIGNS_COL } from "@/lib/firebase/db";
import type { Calendar } from "@/types";

export async function getCampaignCalendar(campaignId: string): Promise<Calendar | null> {
  const db = adminDb();
  const doc = await db.collection(CALENDARS_COL).doc(campaignId).get();
  if (!doc.exists) return null;
  return toCalendar(doc);
}

export async function getCampaignsWithCalendars(
  userId: string,
  excludeCampaignId?: string,
): Promise<{ campaignId: string; campaignName: string; calendar: Calendar }[]> {
  const db = adminDb();

  const [campaignsSnap, calendarsSnap] = await Promise.all([
    db.collection(CAMPAIGNS_COL).where("userId", "==", userId).get(),
    db.collection(CALENDARS_COL).where("userId", "==", userId).get(),
  ]);

  const campaignMap = new Map(
    campaignsSnap.docs.map((doc) => [doc.id, toCampaign(doc)])
  );

  return calendarsSnap.docs
    .filter((doc) => doc.id !== excludeCampaignId)
    .map((doc) => {
      const campaign = campaignMap.get(doc.id);
      if (!campaign) return null;
      return { campaignId: doc.id, campaignName: campaign.name, calendar: toCalendar(doc) };
    })
    .filter((x): x is { campaignId: string; campaignName: string; calendar: Calendar } => x !== null);
}
