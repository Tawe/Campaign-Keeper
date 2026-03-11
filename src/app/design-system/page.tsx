import { TokensSection } from "./_sections/TokensSection";
import { TypographySection } from "./_sections/TypographySection";
import { ButtonsSection } from "./_sections/ButtonsSection";
import { BadgesSection } from "./_sections/BadgesSection";
import { FormsSection } from "./_sections/FormsSection";
import { CardsSection } from "./_sections/CardsSection";
import { OverlaysSection } from "./_sections/OverlaysSection";
import { EditorialSection } from "./_sections/EditorialSection";
import { SharedSection } from "./_sections/SharedSection";

function SectionWrapper({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8 space-y-6 pb-16">
      <div className="border-b border-border/40 pb-3">
        <h2 className="font-serif text-3xl">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="space-y-0">
      <div className="pb-10">
        <h1 className="font-serif text-4xl mb-1">Design System</h1>
        <p className="text-muted-foreground">
          Live component reference for DM Session Manager
        </p>
      </div>

      <SectionWrapper
        id="colors"
        title="Colors"
        description="CSS custom properties defined in globals.css"
      >
        <TokensSection />
      </SectionWrapper>

      <SectionWrapper
        id="typography"
        title="Typography"
        description="Fraunces (serif) + Geist Sans with named utility classes"
      >
        <TypographySection />
      </SectionWrapper>

      <SectionWrapper
        id="radius"
        title="Radius"
        description="Border radius scale used across components"
      >
        <div className="flex flex-wrap gap-4">
          {[
            { label: "rounded-sm", cls: "rounded-sm" },
            { label: "rounded", cls: "rounded" },
            { label: "rounded-md", cls: "rounded-md" },
            { label: "rounded-lg", cls: "rounded-lg" },
            { label: "rounded-xl", cls: "rounded-xl" },
            { label: "rounded-2xl", cls: "rounded-2xl" },
            { label: "rounded-full", cls: "rounded-full" },
          ].map(({ label, cls }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div
                className={`w-14 h-14 bg-primary/20 border border-primary/30 ${cls}`}
              />
              <span className="text-xs text-muted-foreground font-mono">
                {label}
              </span>
            </div>
          ))}
        </div>
      </SectionWrapper>

      <SectionWrapper
        id="buttons"
        title="Buttons"
        description="Button variants, sizes, and custom PrimaryButton / SecondaryButton"
      >
        <ButtonsSection />
      </SectionWrapper>

      <SectionWrapper
        id="badges"
        title="Badges"
        description="All 8 Badge variants"
      >
        <BadgesSection />
      </SectionWrapper>

      <SectionWrapper
        id="forms"
        title="Forms"
        description="Input, Textarea, Label, Select"
      >
        <FormsSection />
      </SectionWrapper>

      <SectionWrapper
        id="cards"
        title="Cards"
        description="Panel, DsCard, StatCard, StatTile, and surface class demos"
      >
        <CardsSection />
      </SectionWrapper>

      <SectionWrapper
        id="tabs"
        title="Tabs"
        description="Tabs with default and line variants"
      >
        <OverlaysSection section="tabs" />
      </SectionWrapper>

      <SectionWrapper
        id="dialog"
        title="Dialog"
        description="Modal dialog with trigger"
      >
        <OverlaysSection section="dialog" />
      </SectionWrapper>

      <SectionWrapper
        id="alert-dialog"
        title="Alert Dialog"
        description="Destructive confirmation dialog"
      >
        <OverlaysSection section="alert-dialog" />
      </SectionWrapper>

      <SectionWrapper
        id="popover"
        title="Popover"
        description="Floating panel anchored to a trigger"
      >
        <OverlaysSection section="popover" />
      </SectionWrapper>

      <SectionWrapper
        id="section-frame"
        title="Section Frame"
        description="Tonal container used in session detail views"
      >
        <EditorialSection section="section-frame" />
      </SectionWrapper>

      <SectionWrapper
        id="meta-strip"
        title="Meta Strip"
        description="Horizontal metadata row with dot separators"
      >
        <EditorialSection section="meta-strip" />
      </SectionWrapper>

      <SectionWrapper
        id="mode-callout"
        title="Mode Callout"
        description="Public/private visibility callout boxes"
      >
        <EditorialSection section="mode-callout" />
      </SectionWrapper>

      <SectionWrapper
        id="stacked-list"
        title="Stacked List"
        description="Compact bordered list rows"
      >
        <EditorialSection section="stacked-list" />
      </SectionWrapper>

      <SectionWrapper
        id="page-header"
        title="Page Header"
        description="Top-of-page header with back nav, eyebrow, and optional action"
      >
        <SharedSection section="page-header" />
      </SectionWrapper>

      <SectionWrapper
        id="empty-state"
        title="Empty State"
        description="Placeholder for empty lists with optional CTA"
      >
        <SharedSection section="empty-state" />
      </SectionWrapper>

      <SectionWrapper
        id="portrait"
        title="Portrait"
        description="Avatar image with User icon fallback"
      >
        <SharedSection section="portrait" />
      </SectionWrapper>

      <SectionWrapper
        id="timeline"
        title="Timeline Item"
        description="Numbered list item with date and tags"
      >
        <SharedSection section="timeline" />
      </SectionWrapper>

      <SectionWrapper
        id="sidebar-nav"
        title="Sidebar Nav Item"
        description="Navigation link for sidebar menus"
      >
        <SharedSection section="sidebar-nav" />
      </SectionWrapper>

      <SectionWrapper
        id="section-header"
        title="Section Header"
        description="Eyebrow label + title combo for page sections"
      >
        <SharedSection section="section-header" />
      </SectionWrapper>

      <SectionWrapper
        id="avatar"
        title="Avatar"
        description="Radix Avatar with image and fallback initial"
      >
        <SharedSection section="avatar" />
      </SectionWrapper>

      <SectionWrapper
        id="visibility-badge"
        title="Visibility Badge"
        description="Public / private badge used on threads and session items"
      >
        <SharedSection section="visibility-badge" />
      </SectionWrapper>
    </div>
  );
}
