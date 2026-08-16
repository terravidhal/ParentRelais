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
    <div className="flex justify-center bg-muted/40 px-4 py-6 lg:items-start lg:px-8 lg:py-10">
      <div className="w-full max-w-[390px] overflow-hidden rounded-[30px] border border-border bg-card shadow-[0_24px_50px_-24px_rgba(8,89,110,0.35)] lg:max-w-240">
        {/* Bannière de connectivité et bouton de synchro : pleine largeur à
            tous les breakpoints, c'est l'élément "impossible à manquer" du
            design system (voir 05-DESIGN-SYSTEM.md) — jamais relégué dans un
            coin même sur grand écran. */}
        <ConnectivityBanner online={online} pendingCount={pendingSessions.length} />

        {online && pendingSessions.length > 0 && (
          <button
            type="button"
            onClick={() => !syncMutation.isPending && syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="font-display flex h-11 w-full items-center justify-center gap-2 bg-primary text-sm font-semibold text-primary-foreground"
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
        )}

        <div className="min-h-[460px] p-5 lg:p-8">
          {seedReady ? children : <Skeleton className="h-64 w-full" />}
        </div>
      </div>
    </div>
  );
}
