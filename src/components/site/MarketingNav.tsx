import Link from "next/link";
import { Github } from "lucide-react";
import { PrimaryButton } from "@/components/ui/primary-button";

interface MarketingNavProps {
  overlay?: boolean;
}

export function MarketingNav({ overlay = false }: MarketingNavProps) {
  return (
    <header
      className={
        overlay
          ? "absolute left-0 right-0 top-0 z-20"
          : "sticky top-0 z-40 border-b border-white/10 bg-[color:color-mix(in_srgb,var(--ds-bg-main)_84%,transparent)] backdrop-blur"
      }
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-serif text-lg tracking-[-0.02em] ds-text-primary">
          Campaign Tracker
        </Link>
        <nav className="hidden items-center gap-5 text-sm ds-text-secondary sm:flex">
          <Link href="/" className="transition-colors hover:text-[var(--ds-text-primary)]">Home</Link>
          <Link href="/features" className="transition-colors hover:text-[var(--ds-text-primary)]">Features</Link>
          <Link href="/about" className="transition-colors hover:text-[var(--ds-text-primary)]">About</Link>
          <a
            href="https://github.com/Tawe/Campaign-Keeper"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub"
            className="transition-colors hover:text-[var(--ds-text-primary)]"
          >
            <Github className="h-4 w-4" />
          </a>
        </nav>
        <PrimaryButton asChild size="sm">
          <Link href="/app/dashboard">Launch App</Link>
        </PrimaryButton>
      </div>
    </header>
  );
}
