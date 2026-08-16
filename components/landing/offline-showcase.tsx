import { ConnectivityBanner } from "@/components/facilitator/connectivity-banner";

/**
 * Réutilise le vrai composant de bannière (pas une capture d'écran) pour
 * illustrer concrètement la promesse offline-first — double comme un aperçu
 * fonctionnel du code de couleur (rouge=hors-ligne, vert=en ligne) que le
 * facilitateur verra réellement dans l'app.
 */
export function OfflineShowcase() {
  return (
    <section className="bg-muted/40 px-6 py-16 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Pensé pour le terrain
        </h2>
        <p className="mt-3 text-muted-foreground">
          Que le réseau soit là ou non, l&apos;application le signale toujours clairement —
          jamais d&apos;ambiguïté sur l&apos;état de synchronisation.
        </p>
        <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3 overflow-hidden rounded-2xl border border-border">
          <ConnectivityBanner online={true} pendingCount={0} />
          <ConnectivityBanner online={false} pendingCount={2} />
        </div>
      </div>
    </section>
  );
}
