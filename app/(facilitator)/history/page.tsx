"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle2, Clock, Users } from "lucide-react";
import { useFacilitatorSessionQuery } from "@/lib/hooks/use-facilitator-session";
import { useAllSessionsQuery } from "@/lib/hooks/use-outbox-query";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeading } from "@/components/ui/page-heading";

/**
 * Historique local des séances animées par ce facilitateur — lit
 * uniquement Dexie.outbox (jamais Supabase), donc disponible hors-ligne
 * comme le reste de la zone facilitateur. Les séances "synced" ne sont
 * jamais supprimées de l'outbox précisément pour alimenter cet écran
 * (voir lib/db/outbox.ts, markSessionsSynced).
 */
export default function HistoryPage() {
  const router = useRouter();
  const { data: session, isLoading: sessionLoading } = useFacilitatorSessionQuery();
  const { data: sessions = [], isLoading: sessionsLoading } = useAllSessionsQuery();

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace("/login");
    }
  }, [sessionLoading, session, router]);

  if (sessionLoading || !session) {
    return <Skeleton className="h-40 w-full" />;
  }

  const totalFamilies = sessions
    .filter((s) => s.status === "synced")
    .reduce((n, s) => n + s.parents_total, 0);

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.held_at).getTime() - new Date(a.held_at).getTime(),
  );

  return (
    <div className="lg:mx-auto lg:max-w-xl">
      <button
        type="button"
        onClick={() => router.push("/home")}
        className="mb-3 flex h-11 items-center gap-1 text-sm font-semibold text-primary"
      >
        <ChevronLeft size={16} aria-hidden="true" /> Retour
      </button>

      <PageHeading>Mes séances</PageHeading>

      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-accent-soft p-3">
        <Users size={18} className="text-accent-ink" aria-hidden="true" />
        <span className="font-display text-sm font-semibold">
          {totalFamilies} famille{totalFamilies > 1 ? "s" : ""} touchée
          {totalFamilies > 1 ? "s" : ""} (séances synchronisées)
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {sessionsLoading ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune séance animée pour l&apos;instant. Ouvrez un module puis
            « Animer une séance ».
          </p>
        ) : (
          sorted.map((s) => (
            <div
              key={s.client_uuid}
              className="flex items-center justify-between rounded-2xl border border-border bg-background p-3"
            >
              <div>
                <p className="font-display text-sm font-semibold">
                  {s.locality}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(s.held_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}{" "}
                  · {s.parents_total} parents · quiz {s.quiz_score}/{s.quiz_max}
                </p>
              </div>
              {s.status === "synced" ? (
                <span
                  className="flex items-center gap-1 text-xs font-semibold text-success"
                  title="Synchronisée"
                >
                  <CheckCircle2 size={16} aria-hidden="true" /> Synced
                </span>
              ) : (
                <span
                  className="flex items-center gap-1 text-xs font-semibold text-accent-ink"
                  title="En attente de synchronisation"
                >
                  <Clock size={16} aria-hidden="true" /> En attente
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
