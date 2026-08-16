"use client";

import Link from "next/link";
import { CheckCircle2, DownloadCloud } from "lucide-react";
import { useMediaDownloadsQuery } from "@/lib/hooks/use-media-downloads-query";

/**
 * Bannière passive de progression — le téléchargement démarre déjà tout
 * seul (voir lib/hooks/use-auto-queue-downloads.ts, branché sur /home).
 * Ce composant ne fait qu'informer, jamais déclencher : cliquer mène au
 * détail (/downloads), rien ne se relance au clic.
 */
export function MediaDownloadBanner() {
  const { data: downloads = [] } = useMediaDownloadsQuery();

  const active = downloads.filter(
    (d) => d.status === "queued" || d.status === "downloading",
  );
  const justDone = downloads.filter((d) => d.status === "done");

  if (active.length === 0) {
    if (justDone.length === 0) return null;
    return (
      <Link
        href="/downloads"
        className="mb-4 flex h-11 w-full items-center justify-between gap-2 rounded-2xl border border-success/30 bg-success-soft px-3 text-sm font-semibold text-success motion-safe:transition"
      >
        <span className="flex items-center gap-2">
          <CheckCircle2 size={18} aria-hidden="true" />
          Contenus disponibles hors-ligne
        </span>
        <span aria-hidden="true">Voir →</span>
      </Link>
    );
  }

  return (
    <Link
      href="/downloads"
      className="mb-4 flex h-11 w-full items-center justify-between gap-2 rounded-2xl border border-accent/30 bg-accent-soft px-3 text-sm font-semibold text-accent motion-safe:transition"
    >
      <span className="flex items-center gap-2">
        <DownloadCloud size={18} aria-hidden="true" className="motion-safe:animate-pulse" />
        {active.length} média{active.length > 1 ? "s" : ""} en téléchargement hors-ligne…
      </span>
      <span aria-hidden="true">Voir →</span>
    </Link>
  );
}
