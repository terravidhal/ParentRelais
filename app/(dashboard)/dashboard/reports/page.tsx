import { FileDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ExportButton } from "@/components/dashboard/export-button";
import { TableToolbar } from "@/components/dashboard/table-toolbar";
import { TablePagination } from "@/components/dashboard/table-pagination";

const PAGE_SIZE = 10;

/** Bornes de la période demandée, ou null si aucune. */
function periodStart(period: string): string | null {
  const now = new Date();
  if (period === "30j") now.setDate(now.getDate() - 30);
  else if (period === "3m") now.setMonth(now.getMonth() - 3);
  else if (period === "12m") now.setMonth(now.getMonth() - 12);
  else return null;
  return now.toISOString();
}

/**
 * Server component : lecture des séances synchronisées, export CSV côté
 * client (ExportButton) à partir de ces mêmes données — pas de nouvelle
 * route API, cohérent avec CLAUDE.md règle 5.
 */
export default async function DashboardReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; periode?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const search = (params.q ?? "").trim();
  const period = (params.periode ?? "").trim();
  const since = periodStart(period);

  // C'est la table qui grossit le plus vite : une ligne par séance animée,
  // par facilitateur. `select("*")` sans limite chargeait tout en mémoire.
  let query = supabase
    .from("sessions")
    .select("*", { count: "exact" })
    .order("held_at", { ascending: false });

  if (search) query = query.ilike("locality", `%${search}%`);
  if (since) query = query.gte("held_at", since);

  const { data: sessions, count } = await query.range(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE - 1,
  );

  const rows = sessions ?? [];
  const totalCount = count ?? rows.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // L'export porte sur la sélection ENTIÈRE, pas sur la page affichée :
  // exporter 25 lignes alors que le filtre en désigne 300 produirait un
  // bilan faux sans que personne s'en aperçoive.
  let exportQuery = supabase
    .from("sessions")
    .select("*")
    .order("held_at", { ascending: false });
  if (search) exportQuery = exportQuery.ilike("locality", `%${search}%`);
  if (since) exportQuery = exportQuery.gte("held_at", since);
  const { data: exportRows } = await exportQuery;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-xs font-semibold tracking-wide text-accent-ink">
            PILOTAGE NATIONAL
          </p>
          <h1 className="font-display text-2xl font-bold">Rapports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalCount === 0
              ? "Aucune séance synchronisée pour l'instant."
              : `${totalCount} séance${totalCount > 1 ? "s" : ""} agrégée${totalCount > 1 ? "s" : ""}, prête${totalCount > 1 ? "s" : ""} à exporter pour les bilans UNICEF/MINPROFF.`}
          </p>
        </div>
        <span id="tour-export">
          <ExportButton rows={exportRows ?? []} />
        </span>
      </div>

      <div className="surface-raised surface-flush">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <FileDown size={16} className="text-muted-foreground" aria-hidden="true" />
          <h3 className="font-display font-bold">Séances</h3>
        </div>

        <TableToolbar
          searchLabel="Rechercher une localité"
          placeholder="Maroua, Mokolo…"
          filters={[
            {
              name: "periode",
              label: "Période",
              options: [
                { value: "30j", label: "30 derniers jours" },
                { value: "3m", label: "3 derniers mois" },
                { value: "12m", label: "12 derniers mois" },
              ],
            },
          ]}
        />

        {rows.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            {search || period
              ? "Aucune séance ne correspond à cette recherche."
              : "Depuis l'app facilitateur, animez une séance puis synchronisez pour la voir apparaître ici."}
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
            {rows.map((s) => (
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

        <TablePagination
          page={page}
          pageCount={pageCount}
          totalCount={totalCount}
          itemLabel="séances"
        />
      </div>
    </div>
  );
}
