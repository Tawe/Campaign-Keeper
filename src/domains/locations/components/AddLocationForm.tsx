"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createLocation, linkLocationToCampaign } from "@/domains/locations/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  campaignId: string;
  availableLocations: { id: string; name: string }[];
}

export function AddLocationForm({ campaignId, availableLocations }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = availableLocations.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        const locationId = await createLocation(campaignId, name);
        router.push(`/campaigns/${campaignId}/locations/${locationId}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add location");
      }
    });
  }

  function handleLink(locationId: string) {
    startTransition(async () => {
      try {
        await linkLocationToCampaign(campaignId, locationId);
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add location");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); setName(""); setSearch(""); }}>
      <DialogTrigger asChild>
        <PrimaryButton size="sm">Add location</PrimaryButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add location</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={availableLocations.length > 0 ? "existing" : "new"}>
          <TabsList className="w-full">
            <TabsTrigger value="existing" className="flex-1" disabled={availableLocations.length === 0}>
              Add existing {availableLocations.length > 0 && `(${availableLocations.length})`}
            </TabsTrigger>
            <TabsTrigger value="new" className="flex-1">Create new</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-3 pt-2">
            <Input
              placeholder="Search locations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            <div className="max-h-52 overflow-y-auto space-y-1">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No locations found</p>
              ) : (
                filtered.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleLink(loc.id)}
                    className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    {loc.name}
                  </button>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="new">
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="location-name">Name</Label>
                <Input
                  id="location-name"
                  placeholder="Location name…"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
                  Cancel
                </Button>
                <PrimaryButton type="submit" disabled={isPending || !name.trim()}>
                  Create location
                </PrimaryButton>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
