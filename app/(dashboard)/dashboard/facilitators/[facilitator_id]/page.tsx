import { ChevronLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <div>
      <Link
        href="/dashboard/facilitators"
        className="mb-3 flex h-11 w-fit items-center gap-1 text-sm font-semibold text-primary"
      >
        <ChevronLeft size={16} aria-hidden="true" /> Retour
      </Link>

      <div className="mb-4">
        <p className="font-display text-xs font-semibold tracking-wide text-accent">
          PILOTAGE NATIONAL
        </p>
        <h1 className="font-display text-2xl font-bold">{displayName}</h1>
        {facilitator?.region && (
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin size={14} aria-hidden="true" /> {facilitator.region}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 lg:p-6">
        <h3 className="font-display mb-3 font-bold">Historique des séances</h3>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune séance synchronisée pour ce facilitateur.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-6 text-xs font-semibold">
              <div className="bg-background p-2">Module</div>
              <div className="bg-background p-2 text-center">Localité</div>
              <div className="bg-background p-2 text-center">Parents</div>
              <div className="bg-background p-2 text-center">Femmes</div>
              <div className="bg-background p-2 text-center">Quiz</div>
              <div className="bg-background p-2 text-center">Date</div>
            </div>
            {rows.map((s) => (
              <div
                key={s.client_uuid}
                className="grid grid-cols-6 items-center border-t border-border text-sm"
              >
                <div className="p-2 font-semibold">Module {s.module_id}</div>
                <div className="p-2 text-center">{s.locality}</div>
                <div className="p-2 text-center">{s.parents_total}</div>
                <div className="p-2 text-center">{s.women}</div>
                <div className="p-2 text-center">
                  {s.quiz_score}/{s.quiz_max}
                </div>
                <div className="p-2 text-center text-xs text-muted-foreground">
                  {new Date(s.held_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
