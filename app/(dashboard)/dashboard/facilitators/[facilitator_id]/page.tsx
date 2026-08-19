import { ChevronLeft, MapPin, BookOpen, Users, Award } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";

/**
 * Server component — historique des séances d'un facilitateur donné. Même
 * pattern de lecture que reports/page.tsx (une requête, pas de nouvelle
 * route API). RLS déjà suffisante : is_admin() couvre `sessions` et
 * `facilitators` (voir 0009_facilitators_table.sql), aucune nouvelle
 * policy nécessaire pour cette page.
 */
export default async function FacilitatorDetailPage({
  params,
}: {
  params: Promise<{ facilitator_id: string }>;
}) {
  const { facilitator_id } = await params;
  const supabase = await createClient();

  const { data: facilitator } = await supabase
    .from("facilitators")
    .select("*")
    .eq("facilitator_id", facilitator_id)
    .maybeSingle();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("facilitator_id", facilitator_id)
    .order("held_at", { ascending: false });

  const rows = sessions ?? [];
  const displayName = facilitator?.full_name ?? `${facilitator_id.slice(0, 8)}…`;
  const totalFamilies = rows.reduce((n, s) => n + s.parents_total, 0);
  const avgQuiz =
    rows.length === 0
      ? 0
      : Math.round(
          (rows.reduce((n, s) => n + s.quiz_score / s.quiz_max, 0) / rows.length) * 100,
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
          value={rows.length}
          icon={<BookOpen size={18} aria-hidden="true" />}
          color="primary"
        />
        <StatCard
          label="Familles touchées"
          value={totalFamilies}
          icon={<Users size={18} aria-hidden="true" />}
          color="success"
        />
        <StatCard
          label="Score moyen au quiz"
          value={avgQuiz}
          icon={<Award size={18} aria-hidden="true" />}
          color="accent"
        />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <BookOpen size={16} className="text-muted-foreground" aria-hidden="true" />
          <h3 className="font-display font-bold">Historique des séances</h3>
        </div>

        {rows.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            Aucune séance synchronisée pour ce facilitateur.
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
      </div>
    </div>
  );
}
