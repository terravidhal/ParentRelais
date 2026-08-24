/**
 * Écran d'attente des pages de pilotage.
 *
 * Ces pages sont des composants serveur : chaque navigation attend une
 * requête Supabase avant de rendre quoi que ce soit. Sans `loading.tsx`,
 * Next.js laisse l'écran précédent figé — l'utilisateur clique, rien ne
 * bouge, et il croit que le lien est cassé. Constaté sur téléphone, où la
 * latence réseau rend l'attente bien plus visible.
 *
 * La silhouette reprend la structure réelle des pages (en-tête, indicateurs,
 * tableau) pour que la transition ne provoque pas de saut visuel.
 */
export function DashboardPageSkeleton({
  cards = 3,
  rows = 5,
}: {
  cards?: number;
  rows?: number;
}) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Chargement en cours…</span>

      <div className="mb-6">
        <div className="h-3 w-32 rounded bg-muted motion-safe:animate-pulse" />
        <div className="mt-2 h-7 w-56 rounded bg-muted motion-safe:animate-pulse" />
      </div>

      {cards > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: cards }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-muted motion-safe:animate-pulse"
            />
          ))}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-border p-5">
        <div className="h-4 w-40 rounded bg-muted motion-safe:animate-pulse" />
        <div className="mt-4 flex flex-col gap-2.5">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="h-11 rounded-xl bg-muted motion-safe:animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
