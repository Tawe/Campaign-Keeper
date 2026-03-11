"use client";

import { usePathname } from "next/navigation";
import { SidebarNavItem } from "@/components/ui/sidebar-nav-item";

interface CampaignWorkspaceSidebarProps {
  campaignId: string;
}

const navItems = [
  { label: "Campaign", href: (campaignId: string) => `/campaigns/${campaignId}` },
  { label: "Sessions", href: (campaignId: string) => `/campaigns/${campaignId}/sessions/new` },
  { label: "Calendar", href: (campaignId: string) => `/campaigns/${campaignId}/calendar` },
  { label: "NPCs", href: (campaignId: string) => `/campaigns/${campaignId}/npcs` },
  { label: "Players", href: (campaignId: string) => `/campaigns/${campaignId}/players` },
  { label: "Locations", href: (campaignId: string) => `/campaigns/${campaignId}/locations` },
  { label: "Factions", href: (campaignId: string) => `/campaigns/${campaignId}/factions` },
  { label: "Events", href: (campaignId: string) => `/campaigns/${campaignId}/events` },
  { label: "Search", href: (campaignId: string) => `/campaigns/${campaignId}/search` },
];

export function CampaignWorkspaceSidebar({ campaignId }: CampaignWorkspaceSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-4 h-[calc(100vh-2rem)] overflow-auto rounded-xl bg-muted/30 p-4">
      <p className="mb-4 text-xs uppercase tracking-[0.14em] text-muted-foreground">Workspace</p>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const href = item.href(campaignId);
          const active = pathname === href;
          return (
            <SidebarNavItem
              key={item.label}
              href={href}
              label={item.label}
              active={active}
            />
          );
        })}
      </nav>
    </aside>
  );
}
