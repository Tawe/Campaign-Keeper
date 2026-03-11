import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface TimelineItemProps {
  href: string;
  index: number;
  title: string;
  date: string;
  tags: string[];
}

export function TimelineItem({ href, index, title, date, tags }: TimelineItemProps) {
  return (
    <Link href={href} className="ds-interactive block p-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">#{index}</p>
          <p className="truncate text-base font-medium text-foreground">{title}</p>
          {tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="border-border/60 text-foreground/70">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p>{date}</p>
          <p className="mt-2 text-primary">View →</p>
        </div>
      </div>
    </Link>
  );
}
