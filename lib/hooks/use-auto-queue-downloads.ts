"use client";

import { useEffect, useRef } from "react";
import type { CachedModule } from "@/lib/db/dexie";
import { collectMediaUrls } from "@/lib/downloads/collect-media";
import { shouldAutoDownload } from "@/lib/downloads/network";
import {
  useMediaDownloadsQuery,
  useQueueDownloadMutation,
} from "@/lib/hooks/use-media-downloads-query";

/**
 * Met automatiquement en file les médias jamais vus dès qu'ils apparaissent
 * dans les modules chargés — pas de clic requis. Ne touche jamais aux
 * entrées déjà connues (done/paused/failed/queued) : seuls les médias sans
 * AUCUNE ligne dans mediaDownloads sont mis en file, pour ne jamais annuler
 * une pause ou relancer un échec sans action explicite de l'utilisateur
 * (le retry manuel reste manuel via /downloads).
 */
export function useAutoQueueDownloads(modules: CachedModule[]): void {
  const { data: downloads = [] } = useMediaDownloadsQuery();
  const queueMutation = useQueueDownloadMutation();
  const queuedThisSession = useRef(new Set<string>());

  useEffect(() => {
    if (modules.length === 0) return;
    // Repris de YouTube offline : le téléchargement AUTOMATIQUE ne part pas
    // sur un lien lent ou quand l'économiseur de données est actif — le
    // forfait d'un facilitateur de terrain n'est pas à dépenser sans son
    // accord. Une mise en file lancée à la main depuis /downloads n'est
    // jamais bloquée par cette règle.
    if (!shouldAutoDownload()) return;
    const known = new Set(downloads.map((d) => d.media_url));

    for (const item of collectMediaUrls(modules)) {
      if (known.has(item.media_url)) continue;
      if (queuedThisSession.current.has(item.media_url)) continue;
      queuedThisSession.current.add(item.media_url);
      queueMutation.mutate(item);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modules, downloads]);
}
