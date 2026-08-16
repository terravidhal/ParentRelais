import Link from "next/link";
import { ChevronLeft, Library } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MediaLibraryList } from "@/components/dashboard/media-library-list";

/**
 * Vue globale de tous les médias déjà déposés en Storage — répond au besoin
 * de voir ce qui existe sans revenir case par case sur la matrice de
 * contenus (app/(dashboard)/dashboard/content/page.tsx).
 */
export default async function MediaLibraryPage() {
  const supabase = await createClient();

  const { data: translations } = await supabase
    .from("module_translations")
    .select("module_id, lang, audio_url, video_url, subtitles_url")
    .or("audio_url.not.is.null,video_url.not.is.null,subtitles_url.not.is.null")
    .order("module_id");

  const entries = (translations ?? []).map((t) => ({
    moduleId: t.module_id,
    lang: t.lang,
    audioUrl: t.audio_url,
    videoUrl: t.video_url,
    subtitlesUrl: t.subtitles_url,
  }));

  return (
    <div className="lg:max-w-3xl">
      <Link
        href="/dashboard/content"
        className="mb-3 flex h-11 w-fit items-center gap-1 text-sm font-semibold text-primary"
      >
        <ChevronLeft size={16} aria-hidden="true" /> Retour aux contenus
      </Link>

      <div className="rounded-2xl border border-border bg-card p-4 lg:p-6">
        <h3 className="font-display mb-3 flex items-center gap-2 font-bold">
          <Library size={16} aria-hidden="true" /> Tous les fichiers déposés
        </h3>
        <MediaLibraryList entries={entries} />
      </div>
    </div>
  );
}
