"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createEvent, linkEventToCampaign } from "@/domains/events/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  campaignId: string;
  availableEvents: { id: string; title: string }[];
}

export function AddEventForm({ campaignId, availableEvents }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = availableEvents.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      try {
        const eventId = await createEvent(campaignId, title);
        router.push(`/campaigns/${campaignId}/events/${eventId}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create event");
      }
    });
  }

  function handleLink(eventId: string) {
    startTransition(async () => {
      try {
        await linkEventToCampaign(campaignId, eventId);
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to link event");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); setTitle(""); setSearch(""); }}>
      <DialogTrigger asChild>
        <PrimaryButton size="sm">Add event</PrimaryButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add event</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={availableEvents.length > 0 ? "existing" : "new"}>
          <TabsList className="w-full">
            <TabsTrigger value="existing" className="flex-1" disabled={availableEvents.length === 0}>
              Link existing {availableEvents.length > 0 && `(${availableEvents.length})`}
            </TabsTrigger>
            <TabsTrigger value="new" className="flex-1">Create new</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-3 pt-2">
            <Input
              placeholder="Search events…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            <div className="max-h-52 overflow-y-auto space-y-1">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No events found</p>
              ) : (
                filtered.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleLink(event.id)}
                    className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    {event.title}
                  </button>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="new">
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="event-title">Title</Label>
                <Input
                  id="event-title"
                  placeholder="Battle of Irongate…"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isPending}
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
                  Cancel
                </Button>
                <PrimaryButton type="submit" disabled={isPending || !title.trim()}>
                  Create event
                </PrimaryButton>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
