"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  CheckCircle2,
  DownloadCloud,
  HardDrive,
  ShieldCheck,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { useFacilitatorSessionQuery } from "@/lib/hooks/use-facilitator-session";
import {
  useCancelDownloadMutation,
  useDeleteDownloadedMediaMutation,
  useMediaDownloadsQuery,
  usePauseAllMutation,
  usePauseDownloadMutation,
  useResumeAllMutation,
  useRetryAllFailedMutation,
  useRetryDownloadMutation,
  useStorageEstimateQuery,
} from "@/lib/hooks/use-media-downloads-query";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeading } from "@/components/ui/page-heading";
import type { MediaDownload } from "@/lib/db/dexie";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} Go`;
}

const MEDIA_TYPE_LABEL: Record<MediaDownload["media_type"], string> = {
  audio: "Audio",
  video: "Vidéo",
  subtitles: "Sous-titres",
};

/**
 * Gestionnaire de téléchargements hors-ligne.
 *
 * La reprise est réelle (HTTP Range) : un fichier coupé à 90 % repart de
 * 90 %, pas de zéro — vérifié sur Supabase Storage et sur les médias servis
 * localement, qui répondent tous deux `206 Partial Content`. Les octets
 * reçus survivent à la fermeture de l'app (voir lib/downloads/manager.ts).
 */
export default function DownloadsPage() {
  const router = useRouter();
  const { data: session, isLoading: sessionLoading } = useFacilitatorSessionQuery();
  const { data: downloads = [], isLoading: downloadsLoading } = useMediaDownloadsQuery();
  const { data: storage } = useStorageEstimateQuery();
  const pauseMutation = usePauseDownloadMutation();
  const retryMutation = useRetryDownloadMutation();
  const cancelMutation = useCancelDownloadMutation();
  const deleteMutation = useDeleteDownloadedMediaMutation();
  const pauseAll = usePauseAllMutation();
  const resumeAll = useResumeAllMutation();
  const retryAll = useRetryAllFailedMutation();

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace("/login");
    }
  }, [sessionLoading, session, router]);

  if (sessionLoading || !session) {
    return <Skeleton className="h-40 w-full" />;
  }

  const active = downloads.filter(
    (d) => d.status === "downloading" || d.status === "queued",
  );
  const paused = downloads.filter((d) => d.status === "paused");
  const failed = downloads.filter((d) => d.status === "failed");
  const done = downloads.filter((d) => d.status === "done");

  const sorted = [...downloads].sort((a, b) => {
    // Ce qui demande une action passe devant : échecs, puis en cours.
    const rank = (d: MediaDownload) =>
      d.status === "failed" ? 0 : d.status === "downloading" ? 1 : d.status === "queued" ? 2 : d.status === "paused" ? 3 : 4;
    const diff = rank(a) - rank(b);
    if (diff !== 0) return diff;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  return (
    <div className="lg:mx-auto lg:max-w-5xl">
      <button
        type="button"
        onClick={() => router.push("/home")}
        className="mb-3 flex h-12 items-center gap-1.5 rounded-xl pr-3 text-base font-semibold text-primary"
      >
        <ChevronLeft size={20} aria-hidden="true" /> Retour
      </button>

      <PageHeading>Téléchargements</PageHeading>
      <p className="mt-1 text-sm text-muted-foreground">
        Vos vidéos et audios restent disponibles sans réseau.
      </p>

      {/* Deux zones à lg: : l'état global (espace, contrôles) reste visible
          à gauche pendant qu'on parcourt la liste à droite. */}
      <div className="lg:mt-4 lg:grid lg:grid-cols-[280px_1fr] lg:items-start lg:gap-6">
      <div className="lg:sticky lg:top-24 flex flex-col gap-3">
      {/* Espace disque : un échec par manque de place doit être anticipé,
          pas subi au milieu d'un fichier de plusieurs centaines de Mo. */}
      {storage && storage.quotaBytes > 0 && (
        <div className="surface">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-semibold">
              <HardDrive size={16} className="text-primary" aria-hidden="true" />
              Espace utilisé
            </span>
            <span className="font-display font-semibold tabular-nums">
              {formatBytes(storage.usedBytes)} / {formatBytes(storage.quotaBytes)}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: `${Math.min(100, Math.round((storage.usedBytes / storage.quotaBytes) * 100))}%`,
              }}
            />
          </div>
          {/* Sans stockage persistant, le navigateur peut effacer ces médias
              quand l'espace se réduit. Le dire, plutôt que de laisser
              découvrir la perte en pleine zone sans réseau. */}
          {storage.persisted ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-success">
              <ShieldCheck size={13} aria-hidden="true" />
              Vos téléchargements sont protégés
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              Installez l&apos;application pour que vos téléchargements soient
              protégés de l&apos;effacement automatique.
            </p>
          )}
        </div>
      )}

      {/* Contrôles globaux : indispensables pour préserver un forfait data. */}
      {(active.length > 0 || paused.length > 0 || failed.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {active.length > 0 && (
            <button
              type="button"
              onClick={() => pauseAll.mutate()}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm font-semibold"
            >
              <Pause size={16} aria-hidden="true" />
              Tout mettre en pause
            </button>
          )}
          {paused.length > 0 && (
            <button
              type="button"
              onClick={() => resumeAll.mutate()}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground"
            >
              <Play size={16} aria-hidden="true" />
              Tout reprendre
            </button>
          )}
          {failed.length > 0 && (
            <button
              type="button"
              onClick={() => retryAll.mutate()}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-accent text-sm font-semibold text-accent-foreground"
            >
              <RotateCcw size={16} aria-hidden="true" />
              Réessayer les {failed.length} échecs
            </button>
          )}
        </div>
      )}

      {done.length > 0 && (
        <p className="flex items-center gap-2 text-sm font-semibold text-success">
          <CheckCircle2 size={16} aria-hidden="true" />
          {done.length} fichier{done.length > 1 ? "s" : ""} disponible
          {done.length > 1 ? "s" : ""} hors-ligne
        </p>
      )}

      </div>

      <div className="mt-4 flex flex-col gap-2.5 lg:mt-0">
        {downloadsLoading ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun téléchargement. Depuis l&apos;accueil, les médias des modules
            se téléchargent automatiquement dès qu&apos;ils sont disponibles.
          </p>
        ) : (
          sorted.map((d) => {
            const pct =
              d.total_bytes && d.total_bytes > 0
                ? Math.min(100, Math.round((d.downloaded_bytes / d.total_bytes) * 100))
                : null;

            return (
              <div
                key={d.media_url}
                className="surface"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display text-sm font-semibold">
                      Module {d.module_id} · {MEDIA_TYPE_LABEL[d.media_type]} ({d.lang})
                    </p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {pct !== null
                        ? `${formatBytes(d.downloaded_bytes)} / ${formatBytes(d.total_bytes as number)} · ${pct} %`
                        : formatBytes(d.downloaded_bytes)}
                    </p>
                  </div>

                  {d.status === "done" && (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-success">
                      <CheckCircle2 size={16} aria-hidden="true" /> Prêt
                    </span>
                  )}
                  {d.status === "failed" && (
                    <span className="shrink-0 text-xs font-semibold text-destructive">
                      Échec
                    </span>
                  )}
                  {(d.status === "queued" || d.status === "downloading") && (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-accent-ink">
                      <DownloadCloud size={16} aria-hidden="true" />
                      {d.status === "downloading" ? "En cours" : "En attente"}
                    </span>
                  )}
                  {d.status === "paused" && (
                    <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                      En pause
                    </span>
                  )}
                </div>

                {d.total_bytes !== null && d.status !== "failed" && (
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={
                        d.status === "done"
                          ? "h-full rounded-full bg-success motion-safe:transition-all"
                          : "h-full rounded-full bg-accent motion-safe:transition-all"
                      }
                      style={{ width: `${d.status === "done" ? 100 : (pct ?? 0)}%` }}
                    />
                  </div>
                )}

                {/* Lecture directe : un média téléchargé doit pouvoir être
                    écouté ou visionné ici, sans avoir à retrouver son module.
                    Le service worker sert le fichier depuis le cache, donc
                    la lecture fonctionne sans réseau. */}
                {d.status === "done" && d.media_type === "audio" && (
                  <audio
                    controls
                    preload="none"
                    src={d.media_url}
                    className="mt-2 h-11 w-full"
                  />
                )}
                {d.status === "done" && d.media_type === "video" && (
                  <video
                    controls
                    preload="metadata"
                    src={d.media_url}
                    className="mt-2 w-full rounded-xl bg-foreground"
                  />
                )}

                {/* Message actionnable : la cause réelle, pas un « Échec » nu. */}
                {d.status === "failed" && d.error_message && (
                  <p className="mt-2 text-xs text-destructive">{d.error_message}</p>
                )}
                {d.status === "paused" && d.downloaded_bytes > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Reprendra à {pct !== null ? `${pct} %` : formatBytes(d.downloaded_bytes)}.
                  </p>
                )}

                <div className="mt-2 flex justify-end gap-2">
                  {d.status === "downloading" && (
                    <button
                      type="button"
                      onClick={() => pauseMutation.mutate(d.media_url)}
                      className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-border px-4 text-sm font-semibold"
                    >
                      <Pause size={16} aria-hidden="true" /> Pause
                    </button>
                  )}
                  {(d.status === "failed" || d.status === "paused") && (
                    <button
                      type="button"
                      onClick={() => retryMutation.mutate(d.media_url)}
                      className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground"
                    >
                      {d.status === "paused" ? (
                        <>
                          <Play size={16} aria-hidden="true" /> Reprendre
                        </>
                      ) : (
                        <>
                          <RotateCcw size={16} aria-hidden="true" /> Réessayer
                        </>
                      )}
                    </button>
                  )}
                  {d.status === "done" ? (
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(d.media_url)}
                      aria-label="Supprimer ce média téléchargé"
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-muted-foreground"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  ) : (
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
    </div>
  );
}
