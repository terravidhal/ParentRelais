"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AudioPlayerProps {
  src: string;
  lang: string;
}

/**
 * Élément <audio> natif (pas de lib externe) : reste offline-safe une fois le
 * fichier précaché par le service worker (docs/02-ARCHITECTURE.md).
 */
export function AudioPlayer({ src, lang }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (audio.duration > 0) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
    };
    // Fichier absent/non précaché (ex. contenu réel UNICEF pas encore fourni).
    const onError = () => {
      setPlaying(false);
      setError("Audio indisponible sur cet appareil.");
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => setError("Audio indisponible sur cet appareil."));
      setPlaying(true);
    }
  };

  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl bg-accent-soft p-3">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? "Mettre en pause" : "Lire l'audio"}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground motion-safe:transition-transform"
      >
        {playing ? (
          <Pause size={20} aria-hidden="true" />
        ) : (
          <Play size={20} aria-hidden="true" />
        )}
      </button>
      <div className="flex-1">
        <p className="font-display flex items-center gap-1 text-sm font-semibold">
          <Volume2 size={14} aria-hidden="true" />
          Écouter le module ({lang.toUpperCase()})
        </p>
        <Progress
          value={progress}
          className="mt-1.5"
          aria-label="Progression de la lecture audio"
        />
        {error && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
