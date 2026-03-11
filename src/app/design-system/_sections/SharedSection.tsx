"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Portrait } from "@/components/shared/Portrait";
import { TimelineItem } from "@/components/ui/timeline-item";
import { SidebarNavItem } from "@/components/ui/sidebar-nav-item";
import { SectionHeader } from "@/components/ui/section-header";
import { Avatar } from "@/components/ui/avatar";
import { VisibilityBadge } from "@/components/shared/VisibilityBadge";

function PageHeaderDemo() {
  return (
    <div className="space-y-1">
      <div className="border border-border/30 rounded-xl overflow-hidden">
        <PageHeader
          eyebrow="Campaign"
          title="The Sunken Realm"
          subtitle="A campaign set in the flooded ruins of an ancient civilization."
          backHref="#"
          backLabel="Campaigns"
          action={<Button size="sm">Log Session</Button>}
        />
      </div>
      <p className="text-xs text-muted-foreground font-mono">
        PageHeader — with eyebrow, back link, subtitle, action
      </p>
    </div>
  );
}

function EmptyStateDemo() {
  return (
    <div className="space-y-1 max-w-md">
      <EmptyState
        title="No sessions yet"
        description="Log your first session to start tracking the story."
        actionLabel="Log Session"
        actionHref="#"
      />
      <p className="text-xs text-muted-foreground font-mono">
        EmptyState — with action
      </p>
    </div>
  );
}

function PortraitDemo() {
  return (
    <div className="flex gap-6">
      <div className="space-y-1">
        <Portrait alt="No image" className="h-24 w-24" />
        <p className="text-xs text-muted-foreground font-mono">
          Portrait — no src (User icon fallback)
        </p>
      </div>
    </div>
  );
}

function TimelineDemo() {
  return (
    <div className="max-w-sm space-y-1 paper-panel rounded-xl overflow-hidden">
      <TimelineItem
        href="#"
        index={14}
        title="The Dragon's Hoard"
        date="Mar 7, 2024"
        tags={["combat", "exploration"]}
      />
      <TimelineItem
        href="#"
        index={13}
        title="Return to Ashenveil"
        date="Feb 22, 2024"
        tags={["roleplay"]}
      />
      <p className="text-xs text-muted-foreground font-mono px-3 pb-3">
        TimelineItem
      </p>
    </div>
  );
}

function SidebarNavDemo() {
  return (
    <div className="w-48 paper-panel rounded-xl p-2 space-y-0.5">
      <SidebarNavItem href="#" label="Sessions" active />
      <SidebarNavItem href="#" label="NPCs" />
      <SidebarNavItem href="#" label="Locations" />
      <SidebarNavItem href="#" label="Factions" />
      <p className="text-xs text-muted-foreground font-mono px-1 pt-2">
        SidebarNavItem — active + inactive
      </p>
    </div>
  );
}

function SectionHeaderDemo() {
  return (
    <div className="space-y-1">
      <SectionHeader
        label="Act II"
        title="The Underdark Awaits"
        description="Your party stands at the edge of the known world."
      />
      <p className="text-xs text-muted-foreground font-mono">
        SectionHeader — with label, title, description
      </p>
    </div>
  );
}

function AvatarDemo() {
  return (
    <div className="flex gap-6 items-center">
      <div className="space-y-1 flex flex-col items-center">
        <Avatar alt="John Munn" />
        <p className="text-xs text-muted-foreground font-mono">Avatar — fallback</p>
      </div>
      <div className="space-y-1 flex flex-col items-center">
        <Avatar alt="Alice" className="h-12 w-12 text-base" />
        <p className="text-xs text-muted-foreground font-mono">Avatar — lg</p>
      </div>
    </div>
  );
}

function VisibilityBadgeDemo() {
  return (
    <div className="flex gap-4">
      <div className="space-y-1 flex flex-col items-start">
        <VisibilityBadge visibility="public" />
        <p className="text-xs text-muted-foreground font-mono">public</p>
      </div>
      <div className="space-y-1 flex flex-col items-start">
        <VisibilityBadge visibility="private" />
        <p className="text-xs text-muted-foreground font-mono">private</p>
      </div>
    </div>
  );
}

export function SharedSection({ section }: { section: string }) {
  if (section === "page-header") return <PageHeaderDemo />;
  if (section === "empty-state") return <EmptyStateDemo />;
  if (section === "portrait") return <PortraitDemo />;
  if (section === "timeline") return <TimelineDemo />;
  if (section === "sidebar-nav") return <SidebarNavDemo />;
  if (section === "section-header") return <SectionHeaderDemo />;
  if (section === "avatar") return <AvatarDemo />;
  if (section === "visibility-badge") return <VisibilityBadgeDemo />;
  return null;
}
