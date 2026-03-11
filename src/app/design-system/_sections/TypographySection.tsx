"use client";

export function TypographySection() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Fraunces (serif) — headings
        </p>
        <div className="space-y-3">
          <div>
            <h1 className="ink-title text-4xl">The Realm of Ashenveil</h1>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              .ink-title text-4xl
            </p>
          </div>
          <div>
            <h2 className="ds-page-title">Campaign Overview</h2>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              .ds-page-title
            </p>
          </div>
          <div>
            <h3 className="ds-section-header font-serif text-2xl">
              Session Recap
            </h3>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              font-serif text-2xl
            </p>
          </div>
          <div>
            <h4 className="font-serif text-xl tracking-[-0.02em]">
              The Dragon&apos;s Lair
            </h4>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              font-serif text-xl tracking-[-0.02em]
            </p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Geist Sans — body
        </p>
        <div className="space-y-3">
          <div>
            <p className="ds-body">
              The party descended into the catacombs beneath the ruined city,
              torches flickering against the damp stone walls. Ahead, the sound
              of chains echoed in the darkness.
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              .ds-body
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Secondary / muted body text at text-sm
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              text-sm text-muted-foreground
            </p>
          </div>
          <div>
            <p className="section-eyebrow">Chapter IV — The Underdark</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              .section-eyebrow
            </p>
          </div>
          <div>
            <p className="ds-section-header">Section Label</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              .ds-section-header
            </p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Mono
        </p>
        <div>
          <p className="font-mono text-sm">campaignId: abc123xyz</p>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            font-mono text-sm
          </p>
        </div>
      </div>
    </div>
  );
}
