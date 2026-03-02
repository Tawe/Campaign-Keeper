import { notFound, redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/firebase/session";
import { CAMPAIGNS_COL } from "@/lib/firebase/db";

export default async function CampaignLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const doc = await adminDb().collection(CAMPAIGNS_COL).doc(campaignId).get();
  if (!doc.exists || doc.data()?.userId !== user.uid) notFound();

  return <>{children}</>;
}
