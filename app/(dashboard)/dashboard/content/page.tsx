import Link from "next/link";
import { Globe, Library, CheckCircle2, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ContentMatrix } from "@/components/dashboard/content-matrix";
import { MediaUploadCell } from "@/components/dashboard/media-upload-cell";
import { StatCard } from "@/components/dashboard/stat-card";

const UPLOADABLE_LANGS = new Set(["fr", "en", "ff", "sign"]);

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

  const totalCells = rows.length * 4;
  const readyCells = rows.reduce(
    (n, r) => n + Object.values(r.statusByLang).filter((s) => s === "ready").length,
    0,
  );

  return (
    <div>
      <div className="mb-6">
        <p className="font-display text-xs font-semibold tracking-wide text-accent-ink">
          PILOTAGE NATIONAL
        </p>
        <h1 className="font-display text-2xl font-bold">Contenus & langues</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Modules"
          value={rows.length}
          icon={<Globe size={18} aria-hidden="true" />}
          color="primary"
          hint="Publiés dans l'app facilitateur"
        />
        <StatCard
          label="Cases prêtes"
          value={readyCells}
          icon={<CheckCircle2 size={18} aria-hidden="true" />}
          color="success"
          hint={
            totalCells > 0
              ? `${Math.round((readyCells / totalCells) * 100)} % des ${totalCells} cases`
              : undefined
          }
        />
        <StatCard
          label="En attente de contenu"
          value={totalCells - readyCells}
          icon={<Clock size={18} aria-hidden="true" />}
          color="accent"
          hint="Déposer un fichier suffit à les remplir"
        />
      </div>

      <div id="tour-matrice" className="mt-6 surface-raised">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="font-display flex items-center gap-2 font-bold">
            <Globe size={16} aria-hidden="true" /> Matrice module × langue
          </h3>
          <Link
            href="/dashboard/content/media"
            className="flex h-11 items-center gap-1.5 text-sm font-semibold text-primary underline-offset-2 hover:underline"
          >
            <Library size={14} aria-hidden="true" />
            Voir tous les fichiers →
          </Link>
        </div>
        <ContentMatrix
          rows={rows}
          renderCellAction={(moduleId, lang) =>
            UPLOADABLE_LANGS.has(lang) ? (
              <MediaUploadCell moduleId={moduleId} lang={lang} />
            ) : null
          }
        />
      </div>
    </div>
  );
}
