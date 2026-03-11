import Link from "next/link";
import { ThemeToggle } from "@/components/site/ThemeToggle";

const navGroups = [
  {
    label: "Foundations",
    links: [
      { href: "#colors", label: "Colors" },
      { href: "#typography", label: "Typography" },
      { href: "#radius", label: "Radius" },
    ],
  },
  {
    label: "Primitives",
    links: [
      { href: "#buttons", label: "Buttons" },
      { href: "#badges", label: "Badges" },
      { href: "#forms", label: "Forms" },
      { href: "#cards", label: "Cards" },
      { href: "#tabs", label: "Tabs" },
    ],
  },
  {
    label: "Overlays",
    links: [
      { href: "#dialog", label: "Dialog" },
      { href: "#alert-dialog", label: "Alert Dialog" },
      { href: "#popover", label: "Popover" },
    ],
  },
  {
    label: "Editorial",
    links: [
      { href: "#section-frame", label: "Section Frame" },
      { href: "#meta-strip", label: "Meta Strip" },
      { href: "#mode-callout", label: "Mode Callout" },
      { href: "#stacked-list", label: "Stacked List" },
    ],
  },
  {
    label: "Shared",
    links: [
      { href: "#page-header", label: "Page Header" },
      { href: "#empty-state", label: "Empty State" },
      { href: "#portrait", label: "Portrait" },
      { href: "#timeline", label: "Timeline Item" },
      { href: "#sidebar-nav", label: "Sidebar Nav Item" },
      { href: "#section-header", label: "Section Header" },
      { href: "#avatar", label: "Avatar" },
      { href: "#visibility-badge", label: "Visibility Badge" },
    ],
  },
];

export default function DesignSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border/60 sticky top-0 h-screen overflow-y-auto p-4 hidden md:block">
        <div className="flex items-center justify-between px-2 mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Design System
          </p>
          <ThemeToggle />
        </div>
        <nav className="space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground/60 px-2 mb-1">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block rounded-lg px-2 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 min-w-0 p-6 sm:p-10 max-w-4xl">{children}</main>
    </div>
  );
}
