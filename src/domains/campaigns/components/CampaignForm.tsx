"use client";

import { useActionState } from "react";
import { createCampaign } from "@/domains/campaigns/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CampaignForm() {
  const [, formAction, pending] = useActionState(
    async (_: unknown, formData: FormData) => {
      await createCampaign(formData);
      return null;
    },
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Campaign name *</Label>
        <Input id="name" name="name" placeholder="The Iron Meridian" required autoFocus />
      </div>
      <div className="space-y-2">
        <Label htmlFor="system">System</Label>
        <Input id="system" name="system" placeholder="5e, PF2e, CoC…" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="participants">Players</Label>
        <Input
          id="participants"
          name="participants"
          placeholder="Alice, Bob, Carol"
        />
        <p className="text-xs text-muted-foreground">
          Comma-separated names — each becomes a player record. You can add characters after.
        </p>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating…" : "Create campaign"}
      </Button>
    </form>
  );
}
