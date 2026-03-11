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
import { removeNpcFromCampaign, deleteNpcPermanently } from "@/domains/npcs/actions";

interface NpcDeleteActionsProps {
  npcId: string;
  campaignId: string;
  fromVault: boolean;
}

export function NpcDeleteActions({ npcId, campaignId, fromVault }: NpcDeleteActionsProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      if (fromVault) {
        await deleteNpcPermanently(npcId);
      } else {
        await removeNpcFromCampaign(npcId, campaignId);
      }
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to delete NPC");
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
            {fromVault ? "Delete NPC permanently?" : "Remove NPC from campaign?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {fromVault
              ? "This will permanently delete this NPC from all campaigns and the vault. This cannot be undone."
              : "This will remove the NPC from this campaign. The NPC will remain in the vault and any other campaigns it belongs to."}
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
