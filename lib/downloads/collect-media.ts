import type { CachedModule } from "@/lib/db/dexie";

export interface ModuleMedia {
  media_url: string;
  module_id: number;
  lang: string;
  media_type: "audio" | "video" | "subtitles";
}

/**
 * Liste tous les médias (audio/vidéo/sous-titres) référencés par les
 * modules chargés — partagée entre la bannière d'affichage (passive) et le
 * hook de mise en file automatique (lib/hooks/use-auto-queue-downloads.ts).
 */
export function collectMediaUrls(modules: CachedModule[]): ModuleMedia[] {
  const items: ModuleMedia[] = [];
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
