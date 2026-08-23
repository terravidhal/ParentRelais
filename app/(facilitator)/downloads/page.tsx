"use client";

import { useEffect } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { useFacilitatorSessionQuery } from "@/lib/hooks/use-facilitator-session";
import {
  useDeleteDownloadedMediaMutation,
  useMediaDownloadsQuery,
  usePauseAllMutation,
  usePauseDownloadMutation,
  useResumeAllMutation,
  useRetryAllFailedMutation,
  useRetryDownloadMutation,
  useStorageEstimateQuery,
} from "@/lib/hooks/use-media-downloads-query";
import { useModulesQuery } from "@/lib/hooks/use-modules-query";
import { usePreferredLangQuery } from "@/lib/hooks/use-preferred-lang";
import { useQueueDownloadMutation } from "@/lib/hooks/use-media-downloads-query";
import { buildModuleStatuses } from "@/lib/downloads/module-status";
import type { ModuleMediaEntry } from "@/lib/downloads/module-status";
import { ModuleDownloadCard } from "@/components/facilitator/module-download-card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeading } from "@/components/ui/page-heading";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} Go`;
}

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
  const deleteMutation = useDeleteDownloadedMediaMutation();
  const pauseAll = usePauseAllMutation();
  const resumeAll = useResumeAllMutation();
  const retryAll = useRetryAllFailedMutation();
  const queueMutation = useQueueDownloadMutation();
  const { data: modules = [], isLoading: modulesLoading } = useModulesQuery();
  const { data: lang = "fr" } = usePreferredLangQuery();

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

  // Vue PAR MODULE : le facilitateur se demande si une séance est animable
  // hors réseau, pas s'il possède tel fichier. La liste plate montrait en
  // plus des doublons, plusieurs modules partageant le même média de démo.
  const moduleStatuses = buildModuleStatuses(modules, downloads, lang);
  const ready = moduleStatuses.filter((m) => m.availability === "complet").length;
  const withMedia = moduleStatuses.filter((m) => m.availability !== "sans-media");

  const handleDownload = (entries: ModuleMediaEntry[]) => {
    for (const entry of entries) {
      queueMutation.mutate({
        media_url: entry.media_url,
        module_id: entry.module_id,
        lang: entry.lang,
        media_type: entry.media_type,
      });
    }
  };

  const busy = queueMutation.isPending;

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
        {downloadsLoading || modulesLoading ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : withMedia.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-background p-4">
            <p className="text-sm text-muted-foreground">
              Aucun module ne contient encore de média dans cette langue. Les
              contenus restent consultables en texte.
            </p>
            <Link
              href="/home"
              className="font-display flex h-12 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              <DownloadCloud size={17} aria-hidden="true" />
              Revenir aux modules
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {ready} module{ready > 1 ? "s" : ""} sur {withMedia.length}{" "}
              disponible{ready > 1 ? "s" : ""} hors-ligne.
            </p>
            {/* Un même fichier peut servir à plusieurs modules : le dire
                évite qu'un module devenu disponible « tout seul » paraisse
                suspect. */}
            <p className="text-xs text-muted-foreground">
              Un fichier partagé par plusieurs modules n’est téléchargé
              qu’une fois.
            </p>
            <ul className="flex flex-col gap-2.5">
              {moduleStatuses.map((status) => (
                <ModuleDownloadCard
                  key={status.module.id}
                  status={status}
                  formatBytes={formatBytes}
                  onDownload={handleDownload}
                  onPause={(url) => pauseMutation.mutate(url)}
                  onResume={(url) => retryMutation.mutate(url)}
                  onDelete={(url) => deleteMutation.mutate(url)}
                  busy={busy}
                />
              ))}
            </ul>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
