"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useContentBootstrap } from "@/lib/hooks/use-content-bootstrap";
import { resumeInterruptedDownloads } from "@/lib/downloads/manager";
import { requestPersistentStorage } from "@/lib/downloads/storage";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { useConnectivityToasts } from "@/lib/hooks/use-connectivity-toasts";
import { usePendingSessionsQuery } from "@/lib/hooks/use-outbox-query";
import { usePathname } from "next/navigation";
import { useSyncOutboxMutation } from "@/lib/hooks/use-sync-outbox-mutation";
import { ConnectivityBanner } from "@/components/facilitator/connectivity-banner";
import { ContentBootstrapScreen } from "@/components/facilitator/content-bootstrap-screen";
import { Skeleton } from "@/components/ui/skeleton";

export default function FacilitatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // La page de connexion porte déjà la marque dans son bandeau illustré :
  // afficher le kicker du header en plus faisait apparaître "PARENTRELAIS"
  // deux fois à l'écran.
  const isLoginPage = pathname === "/login";
  const online = useOnlineStatus();
  const { data: pendingSessions = [] } = usePendingSessionsQuery();
  // Retour explicite au changement de réseau : sans lui, l'utilisateur ne
  // sait pas si une action a échoué à cause de la connexion. Le second
  // argument évite un doublon avec le toast de la synchro.
  useConnectivityToasts(online, pendingSessions.length > 0);
  const syncMutation = useSyncOutboxMutation();
  // Le contenu doit être disponible AVANT que la moindre query Dexie enfant
  // ne se monte : compter sur l'ordre de montage + invalidation React Query
  // s'est révélé fragile (course lors de la redirection /login → /). On
  // bloque le rendu des enfants tant que ce n'est pas confirmé, pattern plus
  // robuste qu'une invalidation a posteriori.
  const { state: contentState, retry: retryContent } = useContentBootstrap();
  const contentReady = contentState === "ready";

  // Un téléchargement coupé par la fermeture de l'app reste bloqué en
  // "downloading" : sans cette reprise, il ne repartirait jamais. Les
  // fichiers mis en pause volontairement ne sont pas touchés.
  useEffect(() => {
    void resumeInterruptedDownloads();
    // Sans cette demande, navigator.storage.persisted() reste à false
    // (vérifié) et le navigateur peut effacer les médias téléchargés quand
    // l'espace se réduit. Pour un facilitateur qui part en zone sans réseau,
    // ce serait une perte silencieuse au pire moment.
    void requestPersistentStorage();
  }, []);

  useEffect(() => {
    if (online && pendingSessions.length > 0 && !syncMutation.isPending) {
      syncMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  // La page de connexion occupe l'écran entier (split-screen illustré, comme
  // côté pilotage) : ni l'en-tête ni le conteneur applicatif ne s'appliquent,
  // ils n'ont de sens qu'une fois connecté.
  //
  // Elle ne dépend PAS du contenu : la connexion n'écrit que l'identité
  // locale et ne lit aucun module. L'ancien seed était une copie locale
  // instantanée, on pouvait la rendre bloquante sans conséquence ; une
  // récupération réseau, elle, peut être lente ou échouer — bloquer la
  // connexion dessus laisserait le facilitateur devant un écran vide sans
  // même pouvoir se connecter.
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header ancré pleine largeur — remplace la carte "téléphone" centrée,
          qui laissait un immense vide sur desktop 1440px+. Pas de sidebar
          (contrairement au dashboard admin) : le facilitateur n'a pas de
          multi-pages de navigation latérale, juste ce header + le contenu. */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1100px] items-center px-5 lg:px-8">
          <p className="font-display text-sm font-bold tracking-wide text-accent-ink">
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
        {contentReady ? (
          children
        ) : contentState === "checking" ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ContentBootstrapScreen
            failed={contentState === "failed"}
            onRetry={retryContent}
          />
        )}
      </main>
    </div>
  );
}
