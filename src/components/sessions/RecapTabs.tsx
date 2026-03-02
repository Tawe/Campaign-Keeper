"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecapView } from "@/components/sessions/RecapView";
import type { RecapContent } from "@/types";

interface RecapTabsProps {
  playerRecap: RecapContent;
  dmRecap: RecapContent;
}

export function RecapTabs({ playerRecap, dmRecap }: RecapTabsProps) {
  return (
    <Tabs defaultValue="player" className="space-y-5">
      <TabsList className="mb-1 w-full sm:w-auto">
        <TabsTrigger value="player">Player recap</TabsTrigger>
        <TabsTrigger value="dm">DM recap</TabsTrigger>
      </TabsList>
      <TabsContent value="player">
        <RecapView recap={playerRecap} mode="player" />
      </TabsContent>
      <TabsContent value="dm">
        <RecapView recap={dmRecap} mode="dm" />
      </TabsContent>
    </Tabs>
  );
}
