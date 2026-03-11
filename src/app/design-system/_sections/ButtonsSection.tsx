"use client";

import { Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";

function DemoBox({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-2">
      {children}
      <p className="text-xs text-muted-foreground font-mono">{label}</p>
    </div>
  );
}

export function ButtonsSection() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Variants
        </p>
        <div className="flex flex-wrap gap-6">
          <DemoBox label="default">
            <Button variant="default">Log Session</Button>
          </DemoBox>
          <DemoBox label="destructive">
            <Button variant="destructive">Delete</Button>
          </DemoBox>
          <DemoBox label="outline">
            <Button variant="outline">Cancel</Button>
          </DemoBox>
          <DemoBox label="secondary">
            <Button variant="secondary">Secondary</Button>
          </DemoBox>
          <DemoBox label="ghost">
            <Button variant="ghost">Ghost</Button>
          </DemoBox>
          <DemoBox label="panel">
            <Button variant="panel">Panel</Button>
          </DemoBox>
          <DemoBox label="link">
            <Button variant="link">Link</Button>
          </DemoBox>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Sizes
        </p>
        <div className="flex flex-wrap items-end gap-6">
          <DemoBox label="xs">
            <Button size="xs">Extra Small</Button>
          </DemoBox>
          <DemoBox label="sm">
            <Button size="sm">Small</Button>
          </DemoBox>
          <DemoBox label="default">
            <Button size="default">Default</Button>
          </DemoBox>
          <DemoBox label="lg">
            <Button size="lg">Large</Button>
          </DemoBox>
          <DemoBox label="icon">
            <Button size="icon">
              <Swords />
            </Button>
          </DemoBox>
          <DemoBox label="icon-sm">
            <Button size="icon-sm">
              <Swords />
            </Button>
          </DemoBox>
          <DemoBox label="icon-xs">
            <Button size="icon-xs">
              <Swords />
            </Button>
          </DemoBox>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Disabled state
        </p>
        <div className="flex flex-wrap gap-6">
          <DemoBox label="default disabled">
            <Button disabled>Log Session</Button>
          </DemoBox>
          <DemoBox label="outline disabled">
            <Button variant="outline" disabled>
              Cancel
            </Button>
          </DemoBox>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Custom buttons
        </p>
        <div className="flex flex-wrap gap-6">
          <DemoBox label="PrimaryButton">
            <PrimaryButton>Add Campaign</PrimaryButton>
          </DemoBox>
          <DemoBox label="SecondaryButton">
            <SecondaryButton>View All</SecondaryButton>
          </DemoBox>
        </div>
      </div>
    </div>
  );
}
