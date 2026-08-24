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
  Settings,
  UserCircle2,
  Menu,
  X,
  HelpCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { DashboardOnboardingTour, runDashboardTour } from "./onboarding-tour";
import { LogoMark } from "@/components/ui/logo-mark";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Couverture", icon: LayoutDashboard, id: "nav-coverage" },
  { href: "/dashboard/facilitators", label: "Facilitateurs", icon: Users, id: "nav-facilitators" },
  { href: "/dashboard/reports", label: "Rapports", icon: FileDown, id: "nav-reports" },
  { href: "/dashboard/content", label: "Contenus", icon: Globe, id: "nav-content" },
  { href: "/dashboard/settings", label: "Référentiel", icon: Settings, id: "nav-settings" },
  // Le profil n'était accessible qu'en cliquant sur l'email de l'en-tête —
  // personne ne peut le deviner.
  { href: "/dashboard/profile", label: "Mon profil", icon: UserCircle2, id: "nav-profile" },
] as const;

interface DashboardShellProps {
  userEmail: string;
  children: ReactNode;
}

/**
 * App-shell desktop-first : sidebar ancrée en fixed sur toute la hauteur du
 * viewport (pas un flex item sticky qui "flotte" dans le flux — la cause de
 * l'effet "sidebar abandonnée" constaté visuellement), header fixe pleine
 * largeur, contenu défilant dans sa propre zone avec un plafond de largeur
 * cohérent (--content-max, réutilisé par toutes les pages enfants plutôt que
 * chacune choisissant son propre max-w-*).
 */
export function DashboardShell({ userEmail, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
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
    <div className="min-h-screen bg-muted/30">
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar : fixed pleine hauteur, ancrée au viewport (pas au flux du
          document) — c'est ce qui la fait paraître structurelle plutôt que
          flottante. */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 -translate-x-full flex-col border-r border-sidebar-border bg-sidebar motion-safe:transition-transform lg:w-64 lg:translate-x-0",
          drawerOpen && "translate-x-0",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <p className="font-display flex items-center gap-2 text-sm font-bold tracking-wide text-accent-ink">
            <LogoMark className="h-6 w-6" />
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
        <nav className="flex flex-1 flex-col gap-1 px-3">
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
                  "flex h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-semibold motion-safe:transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                <Icon size={16} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <button
            type="button"
            onClick={() => runDashboardTour(router, pathname)}
            className="flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-semibold text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          >
            <HelpCircle size={16} aria-hidden="true" />
            Revoir le guide
          </button>
        </div>
      </aside>

      {/* Colonne de contenu : décalée de la largeur de la sidebar en
          desktop, pleine largeur en dessous (la sidebar devient un drawer). */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm lg:px-8">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Ouvrir le menu"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground lg:hidden"
            >
              <Menu size={18} aria-hidden="true" />
            </button>
            <Link
              href="/dashboard/profile"
              className="flex h-11 items-center truncate rounded-xl px-2 text-sm text-muted-foreground hover:bg-muted"
            >
              {userEmail}
            </Link>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-destructive hover:bg-destructive/10"
          >
            <LogOut size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Se déconnecter</span>
          </button>
        </header>

        <main className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <DashboardOnboardingTour />
    </div>
  );
}
