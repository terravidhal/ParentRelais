"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, FileDown, Globe, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { DashboardOnboardingTour } from "./onboarding-tour";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Couverture", icon: LayoutDashboard, id: "nav-coverage" },
  { href: "/dashboard/facilitators", label: "Facilitateurs", icon: Users, id: "nav-facilitators" },
  { href: "/dashboard/reports", label: "Rapports", icon: FileDown, id: "nav-reports" },
  { href: "/dashboard/content", label: "Contenus", icon: Globe, id: "nav-content" },
] as const;

interface DashboardShellProps {
  userEmail: string;
  children: ReactNode;
}

export function DashboardShell({ userEmail, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/dashboard/login");
    router.refresh();
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1680px] gap-6 px-4 py-6 lg:px-10 lg:py-8">
      <aside className="w-56 shrink-0 lg:w-64">
        <div className="rounded-2xl border border-border bg-card p-3">
          <p className="font-display px-2 pb-2 text-xs font-semibold tracking-wide text-accent">
            PARENTRELAIS
          </p>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  id={item.id}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon size={16} aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="mb-4 flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-2.5">
          <span className="truncate text-sm text-muted-foreground">{userEmail}</span>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-destructive hover:bg-destructive/10"
          >
            <LogOut size={16} aria-hidden="true" />
            Se déconnecter
          </button>
        </header>

        <main className="flex-1">{children}</main>
      </div>

      <DashboardOnboardingTour />
    </div>
  );
}
