import { Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ContentMatrix } from "@/components/dashboard/content-matrix";
import { MediaUploadCell } from "@/components/dashboard/media-upload-cell";

const UPLOADABLE_LANGS = new Set(["fr", "en", "ff"]);

/**
 * Server component pour la lecture ; l'upload lui-même est délégué à
 * MediaUploadCell (client) qui écrit directement dans Storage + upsert la
 * ligne module_translations, puis déclenche router.refresh().
 */
export default async function DashboardContentPage() {
  const supabase = await createClient();

  const { data: modules } = await supabase
    .from("modules")
    .select("id")
    .order("position");

  const { data: translations } = await supabase
    .from("module_translations")
    .select("module_id, lang, status");

  const rows = (modules ?? []).map((m) => {
    const statusByLang: Record<string, "ready" | "pending"> = {};
    for (const t of translations ?? []) {
      if (t.module_id === m.id) {
        statusByLang[t.lang] = t.status;
      }
    }
    return { moduleId: m.id, statusByLang };
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-4 lg:max-w-3xl lg:p-6">
      <h3 className="font-display mb-3 flex items-center gap-2 font-bold">
        <Globe size={16} aria-hidden="true" /> Contenus & langues
      </h3>
      <ContentMatrix
        rows={rows}
        renderCellAction={(moduleId, lang) =>
          UPLOADABLE_LANGS.has(lang) ? (
            <MediaUploadCell moduleId={moduleId} lang={lang} />
          ) : null
        }
      />
    </div>
  );
}
