import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-border px-6 py-8 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
        <p>
          ParentRelais — un outil UNICEF Cameroun × MINPROFF pour les facilitateurs de
          parentalité positive.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="font-semibold text-primary underline-offset-2 hover:underline"
          >
            Se connecter
          </Link>
          <Link
            href="/dashboard/login"
            className="text-xs text-muted-foreground/70 underline-offset-2 hover:underline"
          >
            Administration
          </Link>
        </div>
      </div>
    </footer>
  );
}
