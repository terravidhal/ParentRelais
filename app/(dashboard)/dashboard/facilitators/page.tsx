import { Users, MapPin, BookOpen } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { CreateFacilitatorForm } from "@/components/dashboard/create-facilitator-form";

/**
 * Server component. Le nom du facilitateur est synchronisé depuis
 * l'appareil vers `facilitators` à chaque cycle de sync (voir
 * lib/sync/engine.ts, supabase/migrations/0009_facilitators_table.sql) —
 * peut être absent pour des lignes historiques (séance synchronisée avant
 * l'upsert facilitateur correspondant), d'où le repli sur l'UUID tronqué.
 */
export default async function DashboardFacilitatorsPage() {
  const supabase = await createClient();

  const { data: facilitators } = await supabase
    .from("dashboard_facilitators")
    .select("*")
    .order("last_session_at", { ascending: false });

  const rows = facilitators ?? [];
  const totalSessions = rows.reduce((n, r) => n + r.sessions_count, 0);
  const regionCount = new Set(rows.map((r) => r.region)).size;

  return (
    <div>
      <div className="mb-6">
        <CreateFacilitatorForm>
          <p className="font-display text-xs font-semibold tracking-wide text-accent-ink">
            PILOTAGE NATIONAL
          </p>
          <h1 className="font-display text-2xl font-bold">Facilitateurs</h1>
        </CreateFacilitatorForm>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Facilitateurs actifs"
          value={rows.length}
          icon={<Users size={18} aria-hidden="true" />}
          color="primary"
          hint="Ont synchronisé au moins une séance"
        />
        <StatCard
          label="Séances animées au total"
          value={totalSessions}
          icon={<BookOpen size={18} aria-hidden="true" />}
          color="success"
          hint={
            rows.length > 0
              ? `${Math.round(totalSessions / rows.length)} en moyenne par facilitateur`
              : undefined
          }
        />
        <StatCard
          label="Régions couvertes"
          value={regionCount}
          icon={<MapPin size={18} aria-hidden="true" />}
          color="accent"
        />
      </div>

      <div id="tour-table-facilitateurs" className="mt-6 surface-raised surface-flush">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Users size={16} className="text-muted-foreground" aria-hidden="true" />
          <h3 className="font-display font-bold">Activité par facilitateur</h3>
        </div>

        {rows.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            Aucune séance synchronisée pour l&apos;instant.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <div className="grid min-w-150 grid-cols-4 gap-2 px-5 py-2 text-xs font-semibold text-muted-foreground">
              <span>Facilitateur</span>
              <span className="text-center">Région</span>
              <span className="text-center">Séances</span>
              <span className="text-center">Familles</span>
            </div>
            {rows.map((f) => (
              <Link
                // Clé composite : la vue dashboard_facilitators groupe par
                // facilitator_id ET region (0010_facilitators_view_name.sql),
                // donc un facilitateur actif dans deux régions produit deux
                // lignes portant le même identifiant. Avec la seule id en
                // clé, React dupliquait ou omettait des lignes.
                key={`${f.facilitator_id}-${f.region}`}
                href={`/dashboard/facilitators/${f.facilitator_id}`}
                className="grid min-w-150 grid-cols-4 items-center gap-2 border-t border-border px-5 py-3 text-sm transition-colors hover:bg-muted"
              >
                <span className="font-display font-semibold">
                  {f.full_name ?? `${f.facilitator_id.slice(0, 8)}…`}
                </span>
                <span className="text-center text-muted-foreground">{f.region}</span>
                <span className="text-center font-semibold">{f.sessions_count}</span>
                <span className="text-center font-semibold">{f.families_reached}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
