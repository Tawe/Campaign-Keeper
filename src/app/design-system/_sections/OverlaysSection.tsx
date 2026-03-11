"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Campaign Name</DialogTitle>
            <DialogDescription>
              This will update the campaign name across all views.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Dialog body content goes here.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={() => setOpen(false)}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <p className="text-xs text-muted-foreground font-mono">Dialog</p>
    </div>
  );
}

function AlertDialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Delete Campaign
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the campaign and all its data. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => setOpen(false)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <p className="text-xs text-muted-foreground font-mono">AlertDialog</p>
    </div>
  );
}

function PopoverDemo() {
  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Open Popover</Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <p className="text-sm font-medium mb-1">Campaign Info</p>
          <p className="text-sm text-muted-foreground">
            Quick info panel anchored to the trigger element.
          </p>
        </PopoverContent>
      </Popover>
      <p className="text-xs text-muted-foreground font-mono">Popover</p>
    </div>
  );
}

function TabsDemo() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Tabs defaultValue="sessions">
          <TabsList variant="default">
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="npcs">NPCs</TabsTrigger>
            <TabsTrigger value="threads">Threads</TabsTrigger>
          </TabsList>
          <TabsContent value="sessions" className="pt-3">
            <p className="text-sm text-muted-foreground">Sessions content</p>
          </TabsContent>
          <TabsContent value="npcs" className="pt-3">
            <p className="text-sm text-muted-foreground">NPCs content</p>
          </TabsContent>
          <TabsContent value="threads" className="pt-3">
            <p className="text-sm text-muted-foreground">Threads content</p>
          </TabsContent>
        </Tabs>
        <p className="text-xs text-muted-foreground font-mono">
          Tabs — variant=&quot;default&quot;
        </p>
      </div>

      <div className="space-y-2">
        <Tabs defaultValue="overview">
          <TabsList variant="line">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-3">
            <p className="text-sm text-muted-foreground">Overview content</p>
          </TabsContent>
          <TabsContent value="details" className="pt-3">
            <p className="text-sm text-muted-foreground">Details content</p>
          </TabsContent>
          <TabsContent value="history" className="pt-3">
            <p className="text-sm text-muted-foreground">History content</p>
          </TabsContent>
        </Tabs>
        <p className="text-xs text-muted-foreground font-mono">
          Tabs — variant=&quot;line&quot;
        </p>
      </div>
    </div>
  );
}

export function OverlaysSection({ section }: { section: string }) {
  if (section === "dialog") return <DialogDemo />;
  if (section === "alert-dialog") return <AlertDialogDemo />;
  if (section === "popover") return <PopoverDemo />;
  if (section === "tabs") return <TabsDemo />;
  return null;
}
