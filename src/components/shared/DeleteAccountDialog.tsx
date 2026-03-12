"use client";

import { useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { deleteAccount } from "@/domains/account/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CONFIRM_WORD = "DELETE";

export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (isPending) return;
    setOpen(next);
    if (!next) setValue("");
  }

  function handleConfirm() {
    startTransition(async () => {
      await deleteAccount();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Delete account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <DialogTitle>Delete your account</DialogTitle>
          </div>
          <DialogDescription className="pt-1">
            This permanently deletes your account and all data associated with it:
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-4">
          <li>All campaigns, sessions, and plot threads</li>
          <li>All NPCs, locations, factions, and events</li>
          <li>All player rosters and session recaps</li>
          <li>All uploaded images and portraits</li>
        </ul>

        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">This cannot be undone.</strong> Type{" "}
          <span className="font-mono font-semibold text-foreground">{CONFIRM_WORD}</span> to
          confirm.
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-input" className="sr-only">
            Type DELETE to confirm
          </Label>
          <Input
            id="confirm-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={CONFIRM_WORD}
            disabled={isPending}
            autoComplete="off"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={value !== CONFIRM_WORD || isPending}
            onClick={handleConfirm}
          >
            {isPending ? "Deleting…" : "Delete my account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
