"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileDown,
  Globe,
  LogOut,
  Menu,
  X,
  HelpCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { DashboardOnboardingTour, runDashboardTour } from "./onboarding-tour";

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Ferme le drawer sur navigation — ajustement pendant le render plutôt
  // qu'un effet (pattern React recommandé pour dériver un état à partir
  // d'un changement de prop, évite un rendu en cascade superflu).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setDrawerOpen(false);
  }

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/dashboard/login");
    router.refresh();
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-360 gap-6 px-4 py-6 lg:px-8 lg:py-8">
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 -translate-x-full overflow-y-auto p-4 motion-safe:transition-transform lg:static lg:z-auto lg:w-64 lg:translate-x-0 lg:p-0",
          drawerOpen && "translate-x-0",
        )}
      >
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="flex items-center justify-between px-2 pb-2">
            <p className="font-display text-xs font-semibold tracking-wide text-accent">
              PARENTRELAIS
            </p>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Fermer le menu"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground lg:hidden"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Ouvrir le menu"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground lg:hidden"
            >
              <Menu size={18} aria-hidden="true" />
            </button>
            <span className="truncate text-sm text-muted-foreground">{userEmail}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => runDashboardTour()}
              className="flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <HelpCircle size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Revoir le guide</span>
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-destructive hover:bg-destructive/10"
            >
              <LogOut size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Se déconnecter</span>
            </button>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>

      <DashboardOnboardingTour />
    </div>
  );
}
