import { Users } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <div>
      <div className="mb-4">
        <p className="font-display text-xs font-semibold tracking-wide text-accent">
          PILOTAGE NATIONAL
        </p>
        <h1 className="font-display text-2xl font-bold">Facilitateurs</h1>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 lg:p-6">
        <h3 className="font-display mb-3 flex items-center gap-2 font-bold">
          <Users size={16} aria-hidden="true" /> Activité par facilitateur
        </h3>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune séance synchronisée pour l&apos;instant.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-4 text-xs font-semibold">
              <div className="bg-background p-2">Facilitateur</div>
              <div className="bg-background p-2 text-center">Région</div>
              <div className="bg-background p-2 text-center">Séances</div>
              <div className="bg-background p-2 text-center">Familles</div>
            </div>
            {rows.map((f) => (
              <Link
                key={f.facilitator_id}
                href={`/dashboard/facilitators/${f.facilitator_id}`}
                className="grid grid-cols-4 items-center border-t border-border text-sm transition-colors hover:bg-muted"
              >
                <div className="p-2 font-semibold">
                  {f.full_name ?? `${f.facilitator_id.slice(0, 8)}…`}
                </div>
                <div className="p-2 text-center">{f.region}</div>
                <div className="p-2 text-center font-semibold">
                  {f.sessions_count}
                </div>
                <div className="p-2 text-center font-semibold">
                  {f.families_reached}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
