import { Badge } from "@/components/ui/badge";
import type { Visibility } from "@/types";

export function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  if (visibility === "public") {
    return (
      <Badge variant="public">
        Public
      </Badge>
    );
  }
  return (
    <Badge variant="private">
      DM Only
    </Badge>
  );
}
