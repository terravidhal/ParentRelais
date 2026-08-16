"use client";

import { useState } from "react";
import { Captions } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  lang: string;
  subtitlesUrl?: string;
}

/**
 * Élément <video> natif avec piste de sous-titres via <track> (.vtt) —
 * pas de lib externe, reste offline-safe une fois précaché par le service
 * worker, comme AudioPlayer (docs/02-ARCHITECTURE.md).
 *
 * Le badge "Sous-titres disponibles" est nécessaire en plus des contrôles
 * natifs du navigateur : leur icône CC est petite et peu fiable sur les
 * navigateurs mobiles bas de gamme, le public cible du produit — sans cette
 * indication explicite, la fonctionnalité reste invisible pour qui ne sait
 * pas la chercher.
 */
export function VideoPlayer({ src, lang, subtitlesUrl }: VideoPlayerProps) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mt-3">
      {subtitlesUrl && (
        <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
          <Captions size={14} aria-hidden="true" />
          Sous-titres disponibles
        </div>
      )}
      <video
        controls
        preload="metadata"
        className="w-full rounded-2xl bg-foreground"
        aria-label="Vidéo d'exemple"
        onError={() => setError("Vidéo indisponible sur cet appareil.")}
      >
        <source src={src} />
        {subtitlesUrl && (
          <track
            kind="subtitles"
            src={subtitlesUrl}
            srcLang={lang}
            label={lang.toUpperCase()}
            default
          />
        )}
        Votre navigateur ne prend pas en charge la lecture vidéo.
      </video>
      {error && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
