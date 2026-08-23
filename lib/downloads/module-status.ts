import type { CachedModule, MediaDownload } from "@/lib/db/dexie";
import { collectMediaUrls, type ModuleMedia } from "./collect-media";

export type ModuleAvailability =
  /** Tous les médias sont sur l'appareil. */
  | "complet"
  /** Une partie seulement — le module s'ouvre, mais amputé. */
  | "partiel"
  /** Aucun média téléchargé. */
  | "absent"
  /** Le module n'a aucun média : il est consultable en texte, rien à faire. */
  | "sans-media"
  /** Un téléchargement est en cours ou en pause sur ce module. */
  | "en-cours";

export interface ModuleMediaEntry extends ModuleMedia {
  /** Suivi local, absent tant que le fichier n'a jamais été mis en file. */
  download?: MediaDownload;
  /** Le fichier est présent sur l'appareil, quel que soit le module d'origine. */
  available: boolean;
}

export interface ModuleDownloadStatus {
  module: CachedModule;
  title: string;
  availability: ModuleAvailability;
  entries: ModuleMediaEntry[];
  /** Médias manquants, à télécharger pour compléter le module. */
  missing: ModuleMediaEntry[];
  totalBytes: number;
  downloadedBytes: number;
  /** Progression 0–100, uniquement pertinente pendant un téléchargement. */
  percent: number;
}

/**
 * État de disponibilité hors-ligne, agrégé PAR MODULE.
 *
 * La page Téléchargements listait des fichiers bruts (`video.mp4`), alors que
 * le facilitateur raisonne en modules : il ne se demande pas s'il a tel
 * fichier, mais si telle séance est animable sans réseau. Un même fichier de
 * démonstration étant partagé par plusieurs modules, la liste plate affichait
 * en plus des entrées sans signification pour lui.
 *
 * Conséquence assumée du partage : un fichier déjà présent rend disponible
 * tout module qui le référence, sans nouveau téléchargement. L'interface doit
 * le dire, sinon un module qui devient disponible « tout seul » paraîtrait
 * suspect.
 */
export function buildModuleStatuses(
  modules: CachedModule[],
  downloads: MediaDownload[],
  lang: string,
): ModuleDownloadStatus[] {
  const byUrl = new Map(downloads.map((d) => [d.media_url, d]));
  const allMedia = collectMediaUrls(modules);

  return modules.map((module) => {
    // On ne retient que les médias de la langue affichée : proposer de
    // télécharger l'audio anglais à quelqu'un qui travaille en français
    // gonflerait le volume annoncé sans lui servir.
    const seen = new Set<string>();
    const entries: ModuleMediaEntry[] = allMedia
      .filter((m) => m.module_id === module.id && m.lang === lang)
      .filter((m) => {
        if (seen.has(m.media_url)) return false;
        seen.add(m.media_url);
        return true;
      })
      .map((m) => {
        const download = byUrl.get(m.media_url);
        return {
          ...m,
          download,
          available: download?.status === "done",
        };
      });

    const translation =
      module.translations.find((t) => t.lang === lang) ?? module.translations[0];

    const missing = entries.filter((e) => !e.available);
    const active = entries.some(
      (e) =>
        e.download?.status === "downloading" || e.download?.status === "paused",
    );

    const totalBytes = entries.reduce(
      (sum, e) => sum + (e.download?.total_bytes ?? 0),
      0,
    );
    const downloadedBytes = entries.reduce(
      (sum, e) => sum + (e.download?.downloaded_bytes ?? 0),
      0,
    );

    let availability: ModuleAvailability;
    if (entries.length === 0) availability = "sans-media";
    else if (active) availability = "en-cours";
    else if (missing.length === 0) availability = "complet";
    else if (missing.length === entries.length) availability = "absent";
    else availability = "partiel";

    return {
      module,
      title: translation?.title || `Module ${module.id}`,
      availability,
      entries,
      missing,
      totalBytes,
      downloadedBytes,
      percent:
        totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0,
    };
  });
}

/** Libellé lisible d'un type de média. */
export const MEDIA_LABEL: Record<ModuleMedia["media_type"], string> = {
  audio: "Audio",
  video: "Vidéo",
  subtitles: "Sous-titres",
};
