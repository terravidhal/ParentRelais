"use client";

import { useRouter } from "next/navigation";
import { DownloadCloud } from "lucide-react";
import type { CachedModule } from "@/lib/db/dexie";
import {
  useMediaDownloadsQuery,
  useQueueDownloadMutation,
} from "@/lib/hooks/use-media-downloads-query";

interface MediaDownloadBannerProps {
  modules: CachedModule[];
}

interface MissingMedia {
  media_url: string;
  module_id: number;
  lang: string;
  media_type: "audio" | "video" | "subtitles";
}

function collectMediaUrls(modules: CachedModule[]): MissingMedia[] {
  const items: MissingMedia[] = [];
  for (const mod of modules) {
    for (const translation of mod.translations) {
      if (translation.audio_url) {
        items.push({
          media_url: translation.audio_url,
          module_id: mod.id,
          lang: translation.lang,
          media_type: "audio",
        });
      }
      if (translation.video_url) {
        items.push({
          media_url: translation.video_url,
          module_id: mod.id,
          lang: translation.lang,
          media_type: "video",
        });
      }
      if (translation.subtitles_url) {
        items.push({
          media_url: translation.subtitles_url,
          module_id: mod.id,
          lang: translation.lang,
          media_type: "subtitles",
        });
      }
    }
  }
  return items;
}

/**
 * Signale les médias (audio/vidéo/sous-titres) pas encore téléchargés pour
 * un usage hors-ligne complet. Volontairement découplé de SEED_VERSION
 * (lib/content/seed.ts) : ce dernier ne versionne que les métadonnées JSON,
 * le mélanger avec les téléchargements de blobs déclencherait de faux
 * re-téléchargements pour une simple faute de frappe corrigée dans un titre.
 */
export function MediaDownloadBanner({ modules }: MediaDownloadBannerProps) {
  const router = useRouter();
  const { data: downloads = [] } = useMediaDownloadsQuery();
  const queueMutation = useQueueDownloadMutation();

  const known = new Set(downloads.map((d) => d.media_url));
  const done = new Set(
    downloads.filter((d) => d.status === "done").map((d) => d.media_url),
  );
  const missing = collectMediaUrls(modules).filter(
    (item) => !done.has(item.media_url),
  );

  if (missing.length === 0) return null;

  const videoCount = missing.filter((m) => m.media_type === "video").length;
  const audioCount = missing.filter((m) => m.media_type === "audio").length;

  const parts: string[] = [];
  if (videoCount > 0) parts.push(`${videoCount} vidéo${videoCount > 1 ? "s" : ""}`);
  if (audioCount > 0) parts.push(`${audioCount} audio${audioCount > 1 ? "s" : ""}`);

  const handleClick = () => {
    for (const item of missing) {
      if (!known.has(item.media_url)) {
        queueMutation.mutate(item);
      }
    }
    router.push("/downloads");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mb-4 flex h-11 w-full items-center justify-between gap-2 rounded-2xl border border-accent/30 bg-accent-soft px-3 text-sm font-semibold text-accent motion-safe:transition"
    >
      <span className="flex items-center gap-2">
        <DownloadCloud size={18} aria-hidden="true" />
        {parts.join(" et ")} disponible{missing.length > 1 ? "s" : ""} hors-ligne
      </span>
      <span aria-hidden="true">Télécharger →</span>
    </button>
  );
}
