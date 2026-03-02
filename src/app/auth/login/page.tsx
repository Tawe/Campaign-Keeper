import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <p className="section-eyebrow">Editorial Journal</p>
          <h1 className="ink-title max-w-xl text-4xl sm:text-5xl">
            Keep your campaign memory sharper than your party&apos;s notes.
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            Campaign Keeper turns session fallout into a readable campaign record:
            player-safe recaps, DM-only truths, and the threads that still matter.
          </p>
        </div>
        <div className="paper-panel w-full max-w-md justify-self-center px-6 py-8 sm:px-8">
          <div className="mb-6 text-center space-y-2">
            <p className="section-eyebrow">Sign In</p>
            <h2 className="font-serif text-3xl tracking-[-0.02em] text-foreground">Campaign Keeper</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Session memory for tabletop campaigns
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
