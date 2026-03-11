"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

interface Props {
  campaignId: string;
}

const navItems = [
  { label: "Overview", href: (id: string) => `/player/campaigns/${id}` },
  { label: "Sessions", href: (id: string) => `/player/campaigns/${id}/sessions` },
  { label: "NPCs", href: (id: string) => `/player/campaigns/${id}/npcs` },
  { label: "Locations", href: (id: string) => `/player/campaigns/${id}/locations` },
  { label: "Factions", href: (id: string) => `/player/campaigns/${id}/factions` },
  { label: "Events", href: (id: string) => `/player/campaigns/${id}/events` },
  { label: "Players", href: (id: string) => `/player/campaigns/${id}/players` },
  { label: "Calendar", href: (id: string) => `/player/campaigns/${id}/calendar` },
];

export function PlayerCampaignNav({ campaignId }: Props) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border pb-0">
      {navItems.map((item) => {
        const href = item.href(campaignId);
        const active = pathname === href;
        return (
          <Link
            key={item.label}
            href={href}
            className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              active
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
