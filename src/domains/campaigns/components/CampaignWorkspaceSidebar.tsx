"use client";

import { usePathname } from "next/navigation";
import { SidebarNavItem } from "@/components/ui/sidebar-nav-item";

interface CampaignWorkspaceSidebarProps {
  campaignId: string;
}

const navItems = [
  { label: "Campaign", href: (id: string) => `/campaigns/${id}`, exact: true },
  {
    label: "Sessions",
    href: (id: string) => `/campaigns/${id}/sessions/new`,
    activePrefix: (id: string) => `/campaigns/${id}/sessions`,
  },
  { label: "Calendar", href: (id: string) => `/campaigns/${id}/calendar` },
  { label: "Schedule", href: (id: string) => `/campaigns/${id}/schedule` },
  { label: "NPCs", href: (id: string) => `/campaigns/${id}/npcs` },
  { label: "Players", href: (id: string) => `/campaigns/${id}/players` },
  { label: "Locations", href: (id: string) => `/campaigns/${id}/locations` },
  { label: "Maps", href: (id: string) => `/campaigns/${id}/maps` },
  { label: "Factions", href: (id: string) => `/campaigns/${id}/factions` },
  { label: "Events", href: (id: string) => `/campaigns/${id}/events` },
  { label: "Search", href: (id: string) => `/campaigns/${id}/search` },
];

export function CampaignWorkspaceSidebar({ campaignId }: CampaignWorkspaceSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-4 h-[calc(100vh-2rem)] overflow-auto rounded-xl bg-muted/30 p-4">
      <p className="mb-4 text-xs uppercase tracking-[0.14em] text-muted-foreground">Workspace</p>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const href = item.href(campaignId);
          const matchPath = item.activePrefix ? item.activePrefix(campaignId) : href;
          const active = item.exact ? pathname === href : pathname.startsWith(matchPath);
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
