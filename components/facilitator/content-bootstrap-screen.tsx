"use client";

import { CloudOff, RefreshCw } from "lucide-react";

/**
 * Écran affiché tant qu'aucun contenu n'est disponible localement.
 *
 * Le contenu venant maintenant de Supabase et non plus du bundle, une
 * première récupération peut échouer. Un écran vide laisserait le
 * facilitateur sans explication ni recours : on dit ce qui se passe, et on
 * donne un bouton pour réessayer.
 */
export function ContentBootstrapScreen({
  failed,
  onRetry,
}: {
  failed: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-5 text-center">
      {failed ? (
        <>
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive-soft text-destructive">
            <CloudOff size={28} aria-hidden="true" />
          </span>
          <h1 className="font-display mt-5 text-xl font-bold">
            Contenu non reçu
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Les modules n&apos;ont pas pu être téléchargés. Vérifiez votre
            connexion, puis réessayez.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="font-display mt-6 flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground"
          >
            <RefreshCw size={18} aria-hidden="true" />
            Réessayer
          </button>
        </>
      ) : (
        <>
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <RefreshCw
              size={28}
              aria-hidden="true"
              className="motion-safe:animate-spin"
            />
          </span>
          <h1 className="font-display mt-5 text-xl font-bold">
            Récupération des modules…
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Premier démarrage : le contenu est téléchargé une seule fois, puis
            reste disponible hors-ligne.
          </p>
        </>
      )}
    </div>
  );
}
