import { ChevronLeft, MapPin, BookOpen, Users, Award } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { TableToolbar } from "@/components/dashboard/table-toolbar";
import { TablePagination } from "@/components/dashboard/table-pagination";

const PAGE_SIZE = 4;

/** Début de la période demandée, ou null si aucune. */
function periodStart(period: string): string | null {
  const now = new Date();
  if (period === "30j") now.setDate(now.getDate() - 30);
  else if (period === "3m") now.setMonth(now.getMonth() - 3);
  else if (period === "12m") now.setMonth(now.getMonth() - 12);
  else return null;
  return now.toISOString();
}

/**
 * Server component — historique des séances d'un facilitateur donné. Même
 * pattern de lecture que reports/page.tsx (une requête, pas de nouvelle
 * route API). RLS déjà suffisante : is_admin() couvre `sessions` et
 * `facilitators` (voir 0009_facilitators_table.sql), aucune nouvelle
 * policy nécessaire pour cette page.
 */
export default async function FacilitatorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ facilitator_id: string }>;
  searchParams: Promise<{ q?: string; periode?: string; page?: string }>;
}) {
  const { facilitator_id } = await params;
  const query = await searchParams;
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const search = (query.q ?? "").trim();
  const period = (query.periode ?? "").trim();
  const since = periodStart(period);
  const supabase = await createClient();

  const { data: facilitator } = await supabase
    .from("facilitators")
    .select("*")
    .eq("facilitator_id", facilitator_id)
    .maybeSingle();

  // Découpage côté Supabase : un facilitateur actif accumule une séance par
  // animation, sans limite dans le temps.
  let sessionsQuery = supabase
    .from("sessions")
    .select("*", { count: "exact" })
    .eq("facilitator_id", facilitator_id)
    .order("held_at", { ascending: false });

  if (search) sessionsQuery = sessionsQuery.ilike("locality", `%${search}%`);
  if (since) sessionsQuery = sessionsQuery.gte("held_at", since);

  const { data: sessions, count } = await sessionsQuery.range(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE - 1,
  );

  const rows = sessions ?? [];
  const totalCount = count ?? rows.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Les indicateurs portent sur TOUTES les séances, pas sur la page
  // affichée : un total qui changerait en tournant les pages n'indiquerait
  // rien.
  const { data: allSessions } = await supabase
    .from("sessions")
    .select("parents_total, quiz_score, quiz_max, locality")
    .eq("facilitator_id", facilitator_id);
  const everySession = allSessions ?? [];
  const displayName = facilitator?.full_name ?? `${facilitator_id.slice(0, 8)}…`;
  const totalFamilies = everySession.reduce((n, s) => n + s.parents_total, 0);
  // Un module sans quiz enregistre quiz_max = 0 : la division produisait NaN,
  // affiché tel quel dans l'indicateur (constaté en capture). On n'agrège
  // que les séances réellement notées.
  const scored = everySession.filter((s) => s.quiz_max > 0);
  const avgQuiz =
    scored.length === 0
      ? 0
      : Math.round(
          (scored.reduce((n, s) => n + s.quiz_score / s.quiz_max, 0) /
            scored.length) *
            100,
        );

  return (
    <div>
      <Link
        href="/dashboard/facilitators"
        className="mb-3 flex h-11 w-fit items-center gap-1 text-sm font-semibold text-primary"
      >
        <ChevronLeft size={16} aria-hidden="true" /> Retour
      </Link>

      <div className="mb-6">
        <p className="font-display text-xs font-semibold tracking-wide text-accent-ink">
          PILOTAGE NATIONAL
        </p>
        <h1 className="font-display text-2xl font-bold">{displayName}</h1>
        {facilitator?.region && (
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin size={14} aria-hidden="true" /> {facilitator.region}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Séances animées"
          value={totalCount}
          icon={<BookOpen size={18} aria-hidden="true" />}
          color="primary"
        />
        <StatCard
          label="Familles touchées"
          value={totalFamilies}
          icon={<Users size={18} aria-hidden="true" />}
          color="success"
          hint={facilitator?.region ?? undefined}
        />
        <StatCard
          label="Score moyen au quiz (%)"
          value={avgQuiz}
          icon={<Award size={18} aria-hidden="true" />}
          color="accent"
          hint={
            scored.length > 0
              ? `Sur ${scored.length} séance${scored.length > 1 ? "s" : ""} notée${scored.length > 1 ? "s" : ""}`
              : "Aucune séance avec quiz"
          }
        />
      </div>

      <div className="mt-6 surface-raised surface-flush">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <BookOpen size={16} className="text-muted-foreground" aria-hidden="true" />
          <h3 className="font-display font-bold">Historique des séances</h3>
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
              : "Aucune séance synchronisée pour ce facilitateur."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <div className="grid min-w-150 grid-cols-6 gap-2 px-5 py-2 text-xs font-semibold text-muted-foreground">
              <span>Module</span>
              <span className="text-center">Localité</span>
              <span className="text-center">Parents</span>
              <span className="text-center">Femmes</span>
              <span className="text-center">Quiz</span>
              <span className="text-center">Date</span>
            </div>
            {rows.map((s) => (
              <div
                key={s.client_uuid}
                className="grid min-w-150 grid-cols-6 items-center gap-2 border-t border-border px-5 py-3 text-sm"
              >
                <span className="font-semibold">Module {s.module_id}</span>
                <span className="text-center">{s.locality}</span>
                <span className="text-center">{s.parents_total}</span>
                <span className="text-center">{s.women}</span>
                <span className="text-center">
                  {s.quiz_score}/{s.quiz_max}
                </span>
                <span className="text-center text-xs text-muted-foreground">
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
