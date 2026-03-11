import { SectionFrame } from "@/components/shared/editorial";
import type { DmReflection } from "@/types";

interface DmReflectionViewProps {
  reflection: DmReflection;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function StringList({ items }: { items: string[] }) {
  const filtered = items.filter(Boolean);
  if (filtered.length === 0) return <p className="text-sm text-muted-foreground italic">—</p>;
  return (
    <ul className="space-y-0.5 list-disc list-inside">
      {filtered.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

export function DmReflectionView({ reflection }: DmReflectionViewProps) {
  const difficultyLabel = { low: "Low", moderate: "Moderate", hard: "Hard" };

  return (
    <SectionFrame
      title="DM Reflection"
      eyebrow="Private Review"
      description="A private post-session debrief for pacing, engagement, and next-session prep."
      tone="private"
      contentClassName="space-y-6"
    >
      <Section title="Campaign progress">
        <Field label="Main plot advanced">
          {reflection.plot_advancement === null ? (
            <span className="text-muted-foreground italic">—</span>
          ) : reflection.plot_advancement ? (
            <span className="font-medium text-foreground">Yes</span>
          ) : (
            <span className="font-medium text-muted-foreground">No</span>
          )}
        </Field>
        <Field label="Key events / milestones">
          <StringList items={reflection.key_events} />
        </Field>
      </Section>

      <Section title="Player engagement">
        <Field label="Most engaged"><StringList items={reflection.most_engaged} /></Field>
        <Field label="Least engaged"><StringList items={reflection.least_engaged} /></Field>
        <Field label="Memorable moments"><StringList items={reflection.memorable_moments} /></Field>
      </Section>

      {(reflection.combat_difficulty || reflection.combat_balance_issues) && (
        <Section title="Combat encounters">
          {reflection.combat_difficulty && (
            <Field label="Difficulty">
              <span>{difficultyLabel[reflection.combat_difficulty]}</span>
            </Field>
          )}
          {reflection.combat_balance_issues && (
            <Field label="Balance issues">
              <p className="whitespace-pre-wrap">{reflection.combat_balance_issues}</p>
            </Field>
          )}
        </Section>
      )}

      {(reflection.pacing || reflection.where_slowed_down) && (
        <Section title="Pacing &amp; flow">
          {reflection.pacing && (
            <Field label="How was the pacing">
              <p className="whitespace-pre-wrap">{reflection.pacing}</p>
            </Field>
          )}
          {reflection.where_slowed_down && (
            <Field label="Where things slowed down">
              <p className="whitespace-pre-wrap">{reflection.where_slowed_down}</p>
            </Field>
          )}
        </Section>
      )}

      {reflection.next_session_prep && (
        <Section title="Next session prep">
          <p className="text-sm whitespace-pre-wrap">{reflection.next_session_prep}</p>
        </Section>
      )}

      {reflection.personal_reflection && (
        <Section title="Personal reflection">
          <p className="text-sm whitespace-pre-wrap">{reflection.personal_reflection}</p>
        </Section>
      )}
    </SectionFrame>
  );
}
