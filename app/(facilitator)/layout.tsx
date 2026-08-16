"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { ensureSeeded } from "@/lib/db/seedDb";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { usePendingSessionsQuery } from "@/lib/hooks/use-outbox-query";
import { useSyncOutboxMutation } from "@/lib/hooks/use-sync-outbox-mutation";
import { ConnectivityBanner } from "@/components/facilitator/connectivity-banner";
import { Skeleton } from "@/components/ui/skeleton";

export default function FacilitatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const online = useOnlineStatus();
  const { data: pendingSessions = [] } = usePendingSessionsQuery();
  const syncMutation = useSyncOutboxMutation();
  // Le seed doit être terminé AVANT que la moindre query Dexie enfant ne se
  // monte : compter sur l'ordre de montage + invalidation React Query s'est
  // révélé fragile (course entre ensureSeeded() et useModulesQuery() lors
  // de la redirection /login → /). On bloque le rendu des enfants tant que
  // ce n'est pas confirmé, pattern plus robuste qu'une invalidation a posteriori.
  const [seedReady, setSeedReady] = useState(false);

  useEffect(() => {
    ensureSeeded()
      .then(() => setSeedReady(true))
      .catch((error: unknown) => {
        console.error("[facilitator layout] seed initial échoué:", error);
        setSeedReady(true); // ne pas bloquer l'app indéfiniment si le seed échoue
      });
  }, []);

  useEffect(() => {
    if (online && pendingSessions.length > 0 && !syncMutation.isPending) {
      syncMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header ancré pleine largeur — remplace la carte "téléphone" centrée,
          qui laissait un immense vide sur desktop 1440px+. Pas de sidebar
          (contrairement au dashboard admin) : le facilitateur n'a pas de
          multi-pages de navigation latérale, juste ce header + le contenu. */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1100px] items-center px-5 lg:px-8">
          <p className="font-display text-sm font-bold tracking-wide text-accent">
            PARENTRELAIS
          </p>
        </div>
        {/* Bannière de connectivité en pleine largeur, sous le kicker : c'est
            l'élément "impossible à manquer" du design system — la garder en
            bandeau plein plutôt que la réduire à un badge à côté du kicker
            préserve sa lisibilité. */}
        <ConnectivityBanner online={online} pendingCount={pendingSessions.length} />
        {online && pendingSessions.length > 0 && (
          <div className="border-t border-border bg-primary/5">
            <div className="mx-auto max-w-[1100px] px-5 py-2 lg:px-8">
              <button
                type="button"
                onClick={() => !syncMutation.isPending && syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="font-display flex h-11 w-full items-center justify-center gap-2 text-sm font-semibold text-primary lg:w-auto lg:px-4"
              >
                <RefreshCw
                  size={16}
                  aria-hidden="true"
                  className={syncMutation.isPending ? "motion-safe:animate-spin" : ""}
                />
                {syncMutation.isPending
                  ? "Synchronisation…"
                  : `Synchroniser ${pendingSessions.length} séance(s)`}
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-[1100px] px-5 py-5 lg:px-8 lg:py-8">
        {seedReady ? children : <Skeleton className="h-64 w-full" />}
      </main>
    </div>
  );
}
