"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createMap, linkMapToCampaign } from "@/domains/maps/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrimaryButton } from "@/components/ui/primary-button";

interface AddMapFormProps {
  campaignId: string;
  availableMaps: { id: string; name: string }[];
  availableLocations: { id: string; name: string }[];
  defaultLocationId?: string | null;
}

export function AddMapForm({
  campaignId,
  availableMaps,
  availableLocations,
  defaultLocationId = null,
}: AddMapFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [locationId, setLocationId] = useState(defaultLocationId ?? "__none__");
  const [isPending, startTransition] = useTransition();

  const filteredMaps = useMemo(() => availableMaps.filter((map) => (
    map.name.toLowerCase().includes(search.toLowerCase())
  )), [availableMaps, search]);

  function reset() {
    setName("");
    setSearch("");
    setLocationId(defaultLocationId ?? "__none__");
  }

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const mapId = await createMap(
          campaignId,
          name,
          locationId === "__none__" ? null : locationId,
        );
        setOpen(false);
        reset();
        router.push(`/campaigns/${campaignId}/maps/${mapId}`);
      } catch (error) {
        toast.error((error as Error).message ?? "Failed to create map");
      }
    });
  }

  function handleLink(mapId: string) {
    startTransition(async () => {
      try {
        await linkMapToCampaign(campaignId, mapId);
        setOpen(false);
        reset();
        router.refresh();
      } catch (error) {
        toast.error((error as Error).message ?? "Failed to link map");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) reset(); }}>
      <DialogTrigger asChild>
        <PrimaryButton size="sm">Add map</PrimaryButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add map</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={availableMaps.length > 0 ? "existing" : "new"}>
          <TabsList className="w-full">
            <TabsTrigger value="existing" className="flex-1" disabled={availableMaps.length === 0}>
              Add existing {availableMaps.length > 0 ? `(${availableMaps.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="new" className="flex-1">Create new</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-3 pt-2">
            <Input
              placeholder="Search maps…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {filteredMaps.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No maps found.</p>
              ) : (
                filteredMaps.map((map) => (
                  <button
                    key={map.id}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleLink(map.id)}
                    className="w-full rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    {map.name}
                  </button>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="new">
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="map-name">Name</Label>
                <Input
                  id="map-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="World map"
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Linked location</Label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Optional location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No linked location</SelectItem>
                    {availableLocations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
                  Cancel
                </Button>
                <PrimaryButton type="submit" disabled={isPending || !name.trim()}>
                  Create map
                </PrimaryButton>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
