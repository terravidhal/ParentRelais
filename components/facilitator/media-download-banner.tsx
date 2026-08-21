"use client";

import Link from "next/link";
import { CheckCircle2, DownloadCloud, Loader2 } from "lucide-react";
import type { CachedModule } from "@/lib/db/dexie";
import { collectMediaUrls } from "@/lib/downloads/collect-media";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import {
  useMediaDownloadsQuery,
  useQueueDownloadMutation,
} from "@/lib/hooks/use-media-downloads-query";

interface MediaDownloadBannerProps {
  modules: CachedModule[];
}

/**
 * Propose le téléchargement des médias, sans jamais le déclencher seul.
 *
 * Le téléchargement automatique a été retiré : consommer le forfait d'un
 * facilitateur sans son accord n'est pas acceptable, et c'est lui qui sait
 * s'il est sur un réseau qu'il peut se permettre. La bannière annonce donc
 * ce qui est disponible et attend une action explicite.
 */
export function MediaDownloadBanner({ modules }: MediaDownloadBannerProps) {
  const { data: downloads = [] } = useMediaDownloadsQuery();
  const queueMutation = useQueueDownloadMutation();
  const online = useOnlineStatus();

  const known = new Set(downloads.map((d) => d.media_url));
  // Dédoublonnage par URL : plusieurs modules et langues partagent le même
  // fichier. Sans cela, l'annonce comptait 48 fichiers pour 3 réels, avec une
  // taille estimée absurde — de quoi décourager de télécharger.
  const missing = Array.from(
    new Map(
      collectMediaUrls(modules)
        .filter((m) => !known.has(m.media_url))
        .map((m) => [m.media_url, m]),
    ).values(),
  );
  const active = downloads.filter(
    (d) => d.status === "queued" || d.status === "downloading",
  );
  const done = downloads.filter((d) => d.status === "done");

  // Un téléchargement est en cours : on informe et on renvoie au détail.
  if (active.length > 0) {
    return (
      <Link
        href="/downloads"
        className="mb-4 flex min-h-12 w-full items-center justify-between gap-2 rounded-2xl border border-accent/30 bg-accent-soft px-3 py-2 text-sm font-semibold text-accent-ink"
      >
        <span className="flex items-center gap-2">
          <Loader2 size={18} aria-hidden="true" className="motion-safe:animate-spin" />
          {active.length} média{active.length > 1 ? "s" : ""} en cours…
        </span>
        <span aria-hidden="true">Voir →</span>
      </Link>
    );
  }

  // Hors-ligne, proposer un téléchargement serait une promesse intenable.
  if (missing.length > 0 && online) {
    return (
      <button
        type="button"
        onClick={() => missing.forEach((m) => queueMutation.mutate(m))}
        disabled={queueMutation.isPending}
        className="mb-4 flex min-h-12 w-full items-center justify-between gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-3 py-2 text-left text-sm font-semibold text-primary disabled:opacity-60"
      >
        <span className="flex items-center gap-2">
          <DownloadCloud size={18} aria-hidden="true" />
          {missing.length} fichier{missing.length > 1 ? "s" : ""} à télécharger
        </span>
        <span aria-hidden="true">Tout télécharger</span>
      </button>
    );
  }

  if (done.length > 0) {
    return (
      <Link
        href="/downloads"
        className="mb-4 flex min-h-12 w-full items-center justify-between gap-2 rounded-2xl border border-success/30 bg-success-soft px-3 py-2 text-sm font-semibold text-success"
      >
        <span className="flex items-center gap-2">
          <CheckCircle2 size={18} aria-hidden="true" />
          Contenus disponibles hors-ligne
        </span>
        <span aria-hidden="true">Gérer →</span>
      </Link>
    );
  }

  return null;
}
