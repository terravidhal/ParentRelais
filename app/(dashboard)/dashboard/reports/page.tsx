import { FileDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ExportButton } from "@/components/dashboard/export-button";

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

  return (
    <div>
      <div className="mb-4">
        <p className="font-display text-xs font-semibold tracking-wide text-accent">
          PILOTAGE NATIONAL
        </p>
        <h1 className="font-display text-2xl font-bold">Rapports</h1>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 lg:max-w-3xl">
        <h3 className="font-display mb-3 flex items-center gap-2 font-bold">
          <FileDown size={16} aria-hidden="true" /> Export des séances
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {rows.length === 0
            ? "Aucune séance synchronisée pour l'instant."
            : `${rows.length} séance${rows.length > 1 ? "s" : ""} agrégée${rows.length > 1 ? "s" : ""}, prête${rows.length > 1 ? "s" : ""} à exporter pour les bilans UNICEF/MINPROFF.`}
        </p>
        <ExportButton rows={rows} />
      </div>
    </div>
  );
}
