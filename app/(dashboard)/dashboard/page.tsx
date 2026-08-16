import { Users, BookOpen, Accessibility } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { CoverageBars } from "@/components/dashboard/coverage-bars";
import { CoverageChart } from "@/components/dashboard/coverage-chart";

/**
 * Server component — agrégations via la vue Postgres dashboard_coverage
 * (supabase/migrations/0002_dashboard_view.sql) plutôt que de rapatrier
 * toutes les lignes de `sessions` pour sommer côté JS.
 *
 * Différence assumée avec ParentRelais_Demo.jsx : le bloc "séances encore
 * sur le terrain, non synchronisées" de la démo est omis ici — le serveur
 * n'a structurellement aucune visibilité sur l'outbox d'un téléphone
 * hors-ligne qu'il n'a jamais contacté.
 */
export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: coverage } = await supabase
    .from("dashboard_coverage")
    .select("*");

  const rows = coverage ?? [];

  const totalFamilies = rows.reduce((n, r) => n + r.families_reached, 0);
  const totalSessions = rows.reduce((n, r) => n + r.sessions_count, 0);
  const totalDisability = rows.reduce((n, r) => n + r.disability_reached, 0);

  return (
    <div>
      <div className="mb-4">
        <p className="font-display text-xs font-semibold tracking-wide text-accent">
          PILOTAGE NATIONAL
        </p>
        <h1 className="font-display text-2xl font-bold">
          Couverture du programme
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Familles touchées"
          value={totalFamilies}
          icon={<Users size={18} aria-hidden="true" />}
          color="primary"
        />
        <StatCard
          label="Séances animées"
          value={totalSessions}
          icon={<BookOpen size={18} aria-hidden="true" />}
          color="success"
        />
        <StatCard
          label="Dont en situation de handicap"
          value={totalDisability}
          icon={<Accessibility size={18} aria-hidden="true" />}
          color="accent"
        />
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-card p-4">
        <h3 className="font-display mb-3 font-bold">
          Familles touchées par localité
        </h3>
        <CoverageBars
          data={rows.map((r) => ({ label: r.locality, value: r.families_reached }))}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-card p-4">
        <h3 className="font-display mb-3 font-bold">
          Vue graphique — familles touchées par localité
        </h3>
        <CoverageChart
          data={rows.map((r) => ({ label: r.locality, value: r.families_reached }))}
        />
      </div>
    </div>
  );
}
