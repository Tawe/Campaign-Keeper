"use client";

import {
  SectionFrame,
  MetaStrip,
  ModeCallout,
  StackedList,
} from "@/components/shared/editorial";

function SectionFrameDemo() {
  return (
    <div className="space-y-4">
      {(["default", "public", "private", "inset"] as const).map((tone) => (
        <div key={tone} className="space-y-1">
          <SectionFrame
            tone={tone}
            eyebrow="Session 12"
            title={`${tone.charAt(0).toUpperCase() + tone.slice(1)} tone`}
            description="An example section frame showing the tonal surface and header layout."
          >
            <p className="text-sm text-zinc-400">
              Content area — children rendered inside the frame body.
            </p>
          </SectionFrame>
          <p className="text-xs text-muted-foreground font-mono">
            SectionFrame tone=&quot;{tone}&quot;
          </p>
        </div>
      ))}
    </div>
  );
}

function MetaStripDemo() {
  return (
    <div className="space-y-1 max-w-lg">
      <MetaStrip
        items={["Session 12", "Combat & Exploration", "Mar 7, 2024"]}
      />
      <p className="text-xs text-muted-foreground font-mono">
        MetaStrip — 3 items
      </p>
    </div>
  );
}

function ModeCalloutDemo() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
      <div className="space-y-1">
        <ModeCallout
          mode="public"
          title="Players discovered the hidden vault"
          description="Shared with all players in the campaign."
        />
        <p className="text-xs text-muted-foreground font-mono">
          ModeCallout mode=&quot;public&quot;
        </p>
      </div>
      <div className="space-y-1">
        <ModeCallout
          mode="private"
          title="The vault contains the Orb of Doom"
          description="Only visible to the DM."
        />
        <p className="text-xs text-muted-foreground font-mono">
          ModeCallout mode=&quot;private&quot;
        </p>
      </div>
    </div>
  );
}

function StackedListDemo() {
  return (
    <div className="max-w-sm space-y-1">
      <StackedList>
        <div className="px-4 py-3 text-sm">Goblin King — Enemy</div>
        <div className="px-4 py-3 text-sm">Mira the Merchant — Ally</div>
        <div className="px-4 py-3 text-sm">Captain Vex — Neutral</div>
      </StackedList>
      <p className="text-xs text-muted-foreground font-mono">StackedList</p>
    </div>
  );
}

export function EditorialSection({ section }: { section: string }) {
  if (section === "section-frame") return <SectionFrameDemo />;
  if (section === "meta-strip") return <MetaStripDemo />;
  if (section === "mode-callout") return <ModeCalloutDemo />;
  if (section === "stacked-list") return <StackedListDemo />;
  return null;
}
