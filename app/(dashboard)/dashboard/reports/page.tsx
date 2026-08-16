import { FileDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ExportButton } from "@/components/dashboard/export-button";

const PREVIEW_LIMIT = 12;

/**
 * Server component : lecture des séances synchronisées, export CSV côté
 * client (ExportButton) à partir de ces mêmes données — pas de nouvelle
 * route API, cohérent avec CLAUDE.md règle 5.
 */
export default async function DashboardReportsPage() {
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .order("held_at", { ascending: false });

  const rows = sessions ?? [];
  const preview = rows.slice(0, PREVIEW_LIMIT);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-xs font-semibold tracking-wide text-accent">
            PILOTAGE NATIONAL
          </p>
          <h1 className="font-display text-2xl font-bold">Rapports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length === 0
              ? "Aucune séance synchronisée pour l'instant."
              : `${rows.length} séance${rows.length > 1 ? "s" : ""} agrégée${rows.length > 1 ? "s" : ""}, prête${rows.length > 1 ? "s" : ""} à exporter pour les bilans UNICEF/MINPROFF.`}
          </p>
        </div>
        <ExportButton rows={rows} />
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <FileDown size={16} className="text-muted-foreground" aria-hidden="true" />
          <h3 className="font-display font-bold">
            {rows.length > PREVIEW_LIMIT
              ? `Aperçu — ${PREVIEW_LIMIT} séances les plus récentes`
              : "Séances"}
          </h3>
        </div>

        {preview.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            Depuis l&apos;app facilitateur, animez une séance puis synchronisez
            pour la voir apparaître ici.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <div className="grid min-w-180 grid-cols-[1.3fr_1fr_0.8fr_0.8fr_0.8fr_1fr] gap-2 border-b border-border px-5 py-2 text-xs font-semibold text-muted-foreground">
              <span>Localité</span>
              <span>Région</span>
              <span>Parents</span>
              <span>Femmes</span>
              <span>Quiz</span>
              <span>Date</span>
            </div>
            {preview.map((s) => (
              <div
                key={s.client_uuid}
                className="grid min-w-180 grid-cols-[1.3fr_1fr_0.8fr_0.8fr_0.8fr_1fr] gap-2 border-b border-border px-5 py-3 text-sm last:border-b-0"
              >
                <span className="font-display font-semibold">{s.locality}</span>
                <span className="text-muted-foreground">{s.region}</span>
                <span>{s.parents_total}</span>
                <span>{s.women}</span>
                <span>
                  {s.quiz_score}/{s.quiz_max}
                </span>
                <span className="text-muted-foreground">
                  {new Date(s.held_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
