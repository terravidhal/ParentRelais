"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  CheckCircle2,
  DownloadCloud,
  Pause,
  RotateCcw,
  X,
} from "lucide-react";
import { useFacilitatorSessionQuery } from "@/lib/hooks/use-facilitator-session";
import {
  useCancelDownloadMutation,
  useMediaDownloadsQuery,
  usePauseDownloadMutation,
  useRetryDownloadMutation,
} from "@/lib/hooks/use-media-downloads-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { MediaDownload } from "@/lib/db/dexie";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

const MEDIA_TYPE_LABEL: Record<MediaDownload["media_type"], string> = {
  audio: "Audio",
  video: "Vidéo",
  subtitles: "Sous-titres",
};

/**
 * Gestionnaire visuel de la file de téléchargement média (voir
 * lib/downloads/manager.ts) — retry complet depuis le début en cas
 * d'échec (pas de vraie reprise byte-par-byte en V1), file séquentielle
 * (1 fichier à la fois) pour borner la pression mémoire sur téléphone bas
 * de gamme.
 */
export default function DownloadsPage() {
  const router = useRouter();
  const { data: session, isLoading: sessionLoading } = useFacilitatorSessionQuery();
  const { data: downloads = [], isLoading: downloadsLoading } = useMediaDownloadsQuery();
  const pauseMutation = usePauseDownloadMutation();
  const retryMutation = useRetryDownloadMutation();
  const cancelMutation = useCancelDownloadMutation();

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace("/login");
    }
  }, [sessionLoading, session, router]);

  if (sessionLoading || !session) {
    return <Skeleton className="h-40 w-full" />;
  }

  const sorted = [...downloads].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );

  return (
    <div className="lg:mx-auto lg:max-w-xl">
      <button
        type="button"
        onClick={() => router.push("/home")}
        className="mb-3 flex h-11 items-center gap-1 text-sm font-semibold text-primary"
      >
        <ChevronLeft size={16} aria-hidden="true" /> Retour
      </button>

      <p className="font-display text-xs font-semibold tracking-wide text-accent">
        PARENTRELAIS
      </p>
      <h1 className="font-display text-xl font-bold">Téléchargements</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Rendez vos vidéos et audios disponibles hors-ligne.
      </p>

      <div className="mt-4 flex flex-col gap-2.5">
        {downloadsLoading ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun téléchargement en cours. Depuis l&apos;accueil, choisissez
            « Télécharger » quand un média est disponible hors-ligne.
          </p>
        ) : (
          sorted.map((d) => {
            const progressPct =
              d.total_bytes && d.total_bytes > 0
                ? Math.round((d.downloaded_bytes / d.total_bytes) * 100)
                : null;

            return (
              <div
                key={d.media_url}
                className="rounded-2xl border border-border bg-background p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-display text-sm font-semibold">
                      Module {d.module_id} · {MEDIA_TYPE_LABEL[d.media_type]} ({d.lang})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {progressPct !== null
                        ? `${formatBytes(d.downloaded_bytes)} / ${formatBytes(d.total_bytes as number)} (${progressPct}%)`
                        : formatBytes(d.downloaded_bytes)}
                    </p>
                  </div>

                  {d.status === "done" && (
                    <span
                      className="flex items-center gap-1 text-xs font-semibold text-success"
                      title="Disponible hors-ligne"
                    >
                      <CheckCircle2 size={16} aria-hidden="true" /> Prêt
                    </span>
                  )}
                  {d.status === "failed" && (
                    <span
                      className="text-xs font-semibold text-destructive"
                      title={d.error_message ?? "Échec"}
                    >
                      Échec
                    </span>
                  )}
                  {(d.status === "queued" || d.status === "downloading") && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-accent">
                      <DownloadCloud size={16} aria-hidden="true" />
                      {d.status === "downloading" ? "En cours" : "En attente"}
                    </span>
                  )}
                  {d.status === "paused" && (
                    <span className="text-xs font-semibold text-muted-foreground">
                      En pause
                    </span>
                  )}
                </div>

                {d.total_bytes !== null && d.status !== "failed" && (
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-accent motion-safe:transition-all"
                      style={{
                        width: `${d.status === "done" ? 100 : (progressPct ?? 0)}%`,
                      }}
                    />
                  </div>
                )}

                {d.status === "failed" && d.error_message && (
                  <p className="mt-2 text-xs text-destructive">{d.error_message}</p>
                )}

                <div className="mt-2 flex gap-2">
                  {d.status === "downloading" && (
                    <button
                      type="button"
                      onClick={() => pauseMutation.mutate(d.media_url)}
                      className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border text-sm font-semibold"
                    >
                      <Pause size={16} aria-hidden="true" /> Pause
                    </button>
                  )}
                  {(d.status === "failed" || d.status === "paused") && (
                    <button
                      type="button"
                      onClick={() => retryMutation.mutate(d.media_url)}
                      className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent text-sm font-semibold text-accent-foreground"
                    >
                      <RotateCcw size={16} aria-hidden="true" /> Réessayer
                    </button>
                  )}
                  {d.status !== "done" && (
                    <button
                      type="button"
                      onClick={() => cancelMutation.mutate(d.media_url)}
                      aria-label="Annuler ce téléchargement"
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-destructive/30 text-destructive"
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
