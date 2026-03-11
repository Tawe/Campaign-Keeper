"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { removeFactionFromCampaign, deleteFactionPermanently } from "@/domains/factions/actions";

interface FactionDeleteActionsProps {
  factionId: string;
  campaignId: string;
  fromVault: boolean;
}

export function FactionDeleteActions({ factionId, campaignId, fromVault }: FactionDeleteActionsProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      if (fromVault) {
        await deleteFactionPermanently(factionId);
      } else {
        await removeFactionFromCampaign(factionId, campaignId);
      }
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to delete faction");
      setDeleting(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4 mr-1.5" />
          {fromVault ? "Delete permanently" : "Remove from campaign"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {fromVault ? "Delete faction permanently?" : "Remove faction from campaign?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {fromVault
              ? "This will permanently delete this faction from all campaigns and the vault. This cannot be undone."
              : "This will remove the faction from this campaign. The faction will remain in the vault and any other campaigns it belongs to."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? "Deleting…" : fromVault ? "Delete permanently" : "Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
