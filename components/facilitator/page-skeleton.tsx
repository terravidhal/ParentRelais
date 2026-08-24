/**
 * Écran d'attente des pages facilitateur.
 *
 * Mesuré : 1,7 à 2,4 s pour ouvrir un module ou l'historique — davantage
 * que le pilotage, alors que tout est local. Le temps part dans le
 * chargement du bundle de la route, pas dans le réseau. Sans signal,
 * l'écran reste figé et l'utilisateur appuie une seconde fois.
 *
 * Silhouette volontairement simple : la zone facilitateur vise un téléphone
 * bon marché, où une animation complexe coûte plus qu'elle n'apporte.
 */
export function FacilitatorPageSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-3">
      <span className="sr-only">Chargement en cours…</span>
      <div className="h-11 w-24 rounded-xl bg-muted motion-safe:animate-pulse" />
      <div className="h-7 w-48 rounded bg-muted motion-safe:animate-pulse" />
      <div className="mt-2 flex flex-col gap-2.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl bg-muted motion-safe:animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
