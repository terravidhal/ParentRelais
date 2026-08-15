"use client";

interface VideoPlayerProps {
  src: string;
  lang: string;
  subtitlesUrl?: string;
}

/**
 * Élément <video> natif avec piste de sous-titres via <track> (.vtt) —
 * pas de lib externe, reste offline-safe une fois précaché par le service
 * worker, comme AudioPlayer (docs/02-ARCHITECTURE.md).
 */
export function VideoPlayer({ src, lang, subtitlesUrl }: VideoPlayerProps) {
  return (
    <video
      controls
      preload="metadata"
      className="mt-3 w-full rounded-2xl bg-foreground"
      aria-label="Vidéo d'exemple"
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
  );
}
