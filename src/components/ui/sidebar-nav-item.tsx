import Link from "next/link";
import { cn } from "@/lib/utils";

interface SidebarNavItemProps {
  href: string;
  label: string;
  active?: boolean;
}

export function SidebarNavItem({ href, label, active = false }: SidebarNavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-muted/60 text-foreground"
          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );
}
