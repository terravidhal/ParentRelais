import { LogoMark } from "@/components/ui/logo-mark";

/**
 * Écran de chargement plein cadre.
 *
 * Remplace les silhouettes grises : constaté en test sur téléphone, elles se
 * distinguaient mal du fond et l'utilisateur ne savait pas si l'application
 * travaillait ou était bloquée. Un indicateur qui tourne, au centre, ne
 * laisse aucun doute.
 *
 * La marque au centre du cercle rappelle qu'on est dans ParentRelais pendant
 * la transition, plutôt que sur un écran anonyme.
 */
export function LoadingScreen({
  label = "Chargement…",
}: {
  label?: string;
}) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4"
    >
      <span className="relative flex h-20 w-20 items-center justify-center">
        {/* Anneau en rotation. `motion-safe` : figé pour qui a demandé moins
            d'animations, le texte porte alors seul l'information. */}
        <span className="absolute inset-0 rounded-full border-4 border-muted" />
        <span className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary motion-safe:animate-spin" />
        <LogoMark className="h-9 w-9 text-primary" />
      </span>
      <p className="font-display text-sm font-semibold text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
