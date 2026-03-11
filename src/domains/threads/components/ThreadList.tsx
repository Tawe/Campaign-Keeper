import { ThreadItem } from "./ThreadItem";
import { StackedList } from "@/components/shared/editorial";
import type { Thread } from "@/types";

interface ThreadListProps {
  threads: Thread[];
  campaignId: string;
}

export function ThreadList({ threads, campaignId }: ThreadListProps) {
  const open = threads.filter((t) => t.status === "open");
  const resolved = threads.filter((t) => t.status === "resolved");

  return (
    <StackedList>
      {open.map((t) => (
        <ThreadItem key={t.id} thread={t} campaignId={campaignId} />
      ))}
      {resolved.map((t) => (
        <ThreadItem key={t.id} thread={t} campaignId={campaignId} />
      ))}
    </StackedList>
  );
}
