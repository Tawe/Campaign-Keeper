import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { toNpc, toCampaignNpc, toCampaign } from "@/lib/firebase/converters";
import {
  CAMPAIGNS_COL,
  CAMPAIGN_NPCS_COL,
  NPCS_COL,
} from "@/lib/firebase/db";
import { deleteNpcPermanently } from "@/domains/npcs/actions";
import { Portrait } from "@/components/shared/Portrait";
import { PageHeader } from "@/components/shared/PageHeader";
import { VaultDeleteButton } from "@/components/shared/VaultDeleteButton";
import { SectionFrame } from "@/components/shared/editorial";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Panel } from "@/components/ui/panel";

const dispositionColors: Record<string, string> = {
  ally: "bg-public/80 text-[var(--public-foreground)] border-transparent",
  enemy: "bg-destructive/15 text-destructive border-transparent",
  neutral: "bg-secondary text-secondary-foreground border-transparent",
  unknown: "bg-muted text-muted-foreground border-transparent",
};

export default async function NpcVaultDetailPage({
  params,
}: {
  params: Promise<{ npcId: string }>;
}) {
  const { npcId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const db = adminDb();
  const [globalDoc, campaignNpcsSnap] = await Promise.all([
    db.collection(NPCS_COL).doc(npcId).get(),
    db.collection(CAMPAIGN_NPCS_COL).where("npcId", "==", npcId).where("userId", "==", user.uid).get(),
  ]);

  if (!globalDoc.exists || globalDoc.data()?.userId !== user.uid) notFound();

  const npc = toNpc(globalDoc);
  const campaignNpcs = campaignNpcsSnap.docs.map(toCampaignNpc);

  // Fetch campaign names for the campaigns this NPC appears in
  const campaignIds = [...new Set(campaignNpcs.map((cn) => cn.campaign_id))];
  const campaignMap = new Map<string, string>();
  if (campaignIds.length > 0) {
    const campaignRefs = campaignIds.map((id) => db.collection(CAMPAIGNS_COL).doc(id));
    const campaignDocs = await db.getAll(...campaignRefs);
    campaignDocs.forEach((doc) => {
      if (doc.exists) campaignMap.set(doc.id, toCampaign(doc).name);
    });
  }

  return (
    <div className="page-shell max-w-3xl space-y-8">
      <PageHeader
        title={npc.name}
        eyebrow="NPC"
        backHref="/app/npcs"
        backLabel="NPCs"
        action={
          <VaultDeleteButton
            entityName={npc.name}
            description="This will permanently delete this NPC from all campaigns and the vault. This cannot be undone."
            action={deleteNpcPermanently.bind(null, npcId)}
            redirectHref="/app/npcs"
          />
        }
      />

      <div className="flex items-start gap-6">
        <Portrait src={npc.portrait_url} alt={npc.name} className="h-20 w-20 shrink-0" />
        <div className="space-y-2 pt-1">
          {(npc.race || npc.sex || npc.age || npc.alignment) && (
            <div className="flex flex-wrap gap-1.5">
              {npc.race && <Badge variant="outline">{npc.race}</Badge>}
              {npc.sex && <Badge variant="outline">{npc.sex}</Badge>}
              {npc.age && <Badge variant="outline">{npc.age}</Badge>}
              {npc.alignment && <Badge variant="outline">{npc.alignment}</Badge>}
            </div>
          )}
          {npc.npc_class.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {npc.npc_class.map((c) => `${c.name}${c.level ? ` ${c.level}` : ""}`).join(" / ")}
            </p>
          )}
          {npc.stats_link && (
            <a
              href={npc.stats_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Stats sheet →
            </a>
          )}
        </div>
      </div>

      {campaignNpcs.length > 0 && (
        <>
          <Separator />
          <SectionFrame title="Campaigns" eyebrow="Usage">
            <div className="space-y-4">
              {campaignNpcs.map((cn) => {
                const campaignName = campaignMap.get(cn.campaign_id) ?? cn.campaign_id;
                return (
                  <Panel key={cn.campaign_id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/campaigns/${cn.campaign_id}/npcs/${npcId}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {campaignName}
                      </Link>
                      <div className="flex gap-1.5">
                        {cn.status && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            {cn.status}
                          </Badge>
                        )}
                        {cn.disposition && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${dispositionColors[cn.disposition] ?? ""}`}
                          >
                            {cn.disposition}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {cn.last_scene && (
                      <p className="text-sm text-muted-foreground">
                        Last seen: <span className="text-foreground">{cn.last_scene}</span>
                      </p>
                    )}
                    {cn.faction_names.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Factions:{" "}
                        <span className="text-foreground">{cn.faction_names.join(", ")}</span>
                      </p>
                    )}
                    {cn.public_info && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                          Public
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{cn.public_info}</p>
                      </div>
                    )}
                    {cn.private_notes && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                          Notes
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{cn.private_notes}</p>
                      </div>
                    )}
                  </Panel>
                );
              })}
            </div>
          </SectionFrame>
        </>
      )}
    </div>
  );
}
