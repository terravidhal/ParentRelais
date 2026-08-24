import Link from "next/link";
import { Users, BookOpen, Accessibility, ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { CoverageBars } from "@/components/dashboard/coverage-bars";

/**
 * Server component — agrégations via les vues Postgres dashboard_coverage
 * et dashboard_facilitators plutôt que de rapatrier toutes les lignes de
 * `sessions` pour sommer côté JS.
 *
 * Différence assumée avec ParentRelais_Demo.jsx : le bloc "séances encore
 * sur le terrain, non synchronisées" de la démo est omis ici — le serveur
 * n'a structurellement aucune visibilité sur l'outbox d'un téléphone
 * hors-ligne qu'il n'a jamais contacté.
 */
export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: coverage }, { data: facilitators }] = await Promise.all([
    supabase.from("dashboard_coverage").select("*"),
    supabase
      .from("dashboard_facilitators")
      .select("*")
      .order("last_session_at", { ascending: false })
      .limit(6),
  ]);

  const rows = coverage ?? [];
  const activeFacilitators = facilitators ?? [];

  const totalFamilies = rows.reduce((n, r) => n + r.families_reached, 0);
  const totalSessions = rows.reduce((n, r) => n + r.sessions_count, 0);
  const totalDisability = rows.reduce((n, r) => n + r.disability_reached, 0);

  return (
    <div>
      <div className="mb-6">
        <p className="font-display text-xs font-semibold tracking-wide text-accent-ink">
          PILOTAGE NATIONAL
        </p>
        <h1 className="font-display text-2xl font-bold">
          Couverture du programme
        </h1>
      </div>

      <div id="tour-kpis" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Familles touchées"
          value={totalFamilies}
          icon={<Users size={18} aria-hidden="true" />}
          color="primary"
          hint={`Sur ${rows.length} localité${rows.length > 1 ? "s" : ""}`}
        />
        <StatCard
          label="Séances animées"
          value={totalSessions}
          icon={<BookOpen size={18} aria-hidden="true" />}
          color="success"
          hint="Séances synchronisées depuis le terrain"
        />
        <StatCard
          label="Dont en situation de handicap"
          value={totalDisability}
          icon={<Accessibility size={18} aria-hidden="true" />}
          color="accent"
          hint={
            totalFamilies > 0
              ? `${Math.round((totalDisability / totalFamilies) * 100)} % des familles touchées`
              : "Aucune donnée pour l'instant"
          }
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div id="tour-localites" className="surface-raised">
          <h3 className="font-display mb-4 font-bold">
            Familles touchées par localité
          </h3>
          {/* Aperçu borné aux dix premières localités, triées par volume :
              un graphique à barres devient illisible au-delà, et le détail
              complet est déjà dans les Rapports. */}
          <CoverageBars
            data={[...rows]
              .sort((a, b) => b.families_reached - a.families_reached)
              .slice(0, 10)
              .map((r) => ({ label: r.locality, value: r.families_reached }))}
          />
          {rows.length > 10 && (
            <p className="mt-3 text-xs text-muted-foreground">
              10 localités affichées sur {rows.length}.{" "}
              <Link
                href="/dashboard/reports"
                className="font-semibold text-primary hover:underline"
              >
                Voir toutes les séances
              </Link>
            </p>
          )}
        </div>

        <div id="tour-facilitateurs-actifs" className="surface-raised">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display font-bold">Facilitateurs actifs</h3>
            <Link
              href="/dashboard/facilitators"
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Tout voir <ArrowUpRight size={12} aria-hidden="true" />
            </Link>
          </div>

          {activeFacilitators.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun facilitateur n&apos;a encore synchronisé de séance.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {activeFacilitators.map((f) => (
                <Link
                  // Même vue que /dashboard/facilitators : une ligne par
                  // couple (facilitateur, région), d'où la clé composite.
                  key={`${f.facilitator_id}-${f.region}`}
                  href={`/dashboard/facilitators/${f.facilitator_id}`}
                  className="flex items-center justify-between rounded-xl px-2 py-2.5 text-sm hover:bg-muted"
                >
                  <div className="min-w-0">
                    <p className="font-display truncate font-semibold">
                      {f.full_name ?? `${f.facilitator_id.slice(0, 8)}…`}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {f.region}
                    </p>
                  </div>
                  <span className="font-display shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                    {f.sessions_count} séance{f.sessions_count > 1 ? "s" : ""}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
