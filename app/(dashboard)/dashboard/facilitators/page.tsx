import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

/**
 * Server component. Le nom du facilitateur n'existe nulle part côté
 * Supabase : il est saisi au login PIN local et ne quitte jamais Dexie
 * (voir lib/db/meta.ts) — seul facilitator_id (UUID généré côté client)
 * accompagne chaque séance synchronisée. On affiche donc un identifiant
 * court plutôt qu'un nom, fidèle à l'état réel des données.
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
              <div
                key={f.facilitator_id}
                className="grid grid-cols-4 items-center border-t border-border text-sm"
              >
                <div className="p-2 font-mono text-xs">
                  {f.facilitator_id.slice(0, 8)}…
                </div>
                <div className="p-2 text-center">{f.region}</div>
                <div className="p-2 text-center font-semibold">
                  {f.sessions_count}
                </div>
                <div className="p-2 text-center font-semibold">
                  {f.families_reached}
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Identifiant technique affiché plutôt qu&apos;un nom : le
          facilitateur s&apos;authentifie localement (PIN), son nom ne
          quitte jamais son appareil.
        </p>
      </div>
    </div>
  );
}
