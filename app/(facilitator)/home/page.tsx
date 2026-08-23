"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, CheckCircle2, Clock, History, Settings2 } from "lucide-react";
import { useModulesQuery } from "@/lib/hooks/use-modules-query";
import { useFacilitatorSessionQuery } from "@/lib/hooks/use-facilitator-session";
import { useAllSessionsQuery } from "@/lib/hooks/use-outbox-query";
import {
  usePreferredLangQuery,
  useSetPreferredLangMutation,
} from "@/lib/hooks/use-preferred-lang";
import { LangPills } from "@/components/facilitator/lang-pills";
import { ModuleCard } from "@/components/facilitator/module-card";
import { ModulePagination } from "@/components/facilitator/module-pagination";
import { MediaDownloadBanner } from "@/components/facilitator/media-download-banner";
import { FacilitatorOnboardingTour } from "@/components/facilitator/onboarding-tour";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeading } from "@/components/ui/page-heading";
import type { CachedModule } from "@/lib/db/dexie";

// 2 colonnes × 3 lignes à desktop (lg:), pile de 6 sur mobile — page size
// fixe plutôt que dépendante du viewport pour rester simple côté offline.
const PAGE_SIZE = 6;

export default function HomePage() {
  const router = useRouter();
  const { data: session, isLoading: sessionLoading } = useFacilitatorSessionQuery();
  const { data: modules = [], isLoading: modulesLoading } = useModulesQuery();
  const { data: sessions = [] } = useAllSessionsQuery();
  const { data: lang = "fr" } = usePreferredLangQuery();
  const setLangMutation = useSetPreferredLangMutation();
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace("/login");
    }
  }, [sessionLoading, session, router]);

  const handleOpen = (module: CachedModule) => {
    router.push(`/module?id=${module.id}`);
  };

  const pageCount = Math.max(1, Math.ceil(modules.length / PAGE_SIZE));
  // Dérivé plutôt que corrigé via un effet : si le nombre de modules baisse
  // (ex. après un reset de contenu), la page courante peut dépasser le
  // nouveau pageCount le temps d'un rendu — on la ramène ici, sans setState.
  const currentPage = Math.min(page, pageCount);
  const pagedModules = modules.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const syncedCount = sessions.filter((s) => s.status === "synced").length;
  const pendingCount = sessions.length - syncedCount;
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.held_at).getTime() - new Date(a.held_at).getTime())
    .slice(0, 3);

  if (sessionLoading || !session) {
    return <Skeleton className="h-40 w-full" />;
  }

  return (
    <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
      {/* Colonne gauche : identité + contexte — n'existe comme colonne qu'à
          lg:, sur mobile c'est simplement le haut de la pile. */}
      <div className="lg:sticky lg:top-8 lg:self-start">
        <div className="mb-1 flex items-center justify-between">
          <div>
            <PageHeading>Bonjour, {session.full_name}</PageHeading>
          </div>
          <button
            type="button"
            onClick={() => router.push("/profile")}
            aria-label="Profil et paramètres"
            id="profile-button"
            className="font-display relative flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft font-bold text-accent-ink lg:order-first lg:mb-4"
          >
            {session.full_name.slice(0, 2).toUpperCase()}
            <span
              aria-hidden="true"
              className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-card"
            >
              <Settings2 size={10} strokeWidth={3} />
            </span>
          </button>
        </div>

        {/* Bloc d'historique réel plutôt qu'un simple lien : le facilitateur
            doit voir son activité d'un coup d'œil, avec l'état de synchro de
            chaque séance. Le lien seul ne représentait rien. */}
        <div className="surface mt-3">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push("/history")}
              className="flex items-center gap-1.5 font-display text-sm font-semibold underline-offset-2 hover:underline"
            >
              <History size={15} className="text-primary" aria-hidden="true" />
              Mes séances
            </button>
            {sessions.length > 0 && (
              <span className="font-display rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold tabular-nums text-primary">
                {sessions.length}
              </span>
            )}
          </div>

          {sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Aucune séance pour l&apos;instant. Ouvrez un module puis
              « Animer une séance ».
            </p>
          ) : (
            <>
              <div className="mb-2 flex gap-3 text-xs">
                <span className="flex items-center gap-1 text-success">
                  <CheckCircle2 size={13} aria-hidden="true" />
                  {syncedCount} synchronisée{syncedCount > 1 ? "s" : ""}
                </span>
                {pendingCount > 0 && (
                  <span className="flex items-center gap-1 text-accent-ink">
                    <Clock size={13} aria-hidden="true" />
                    {pendingCount} en attente
                  </span>
                )}
              </div>
              <ul className="flex flex-col divide-y divide-border">
                {recentSessions.map((s) => (
                  <li
                    key={s.client_uuid}
                    className="flex items-center justify-between gap-2 py-2 text-xs first:pt-0"
                  >
                    <span className="min-w-0">
                      <span className="font-display block truncate font-semibold">
                        {s.locality}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(s.held_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                        })}{" "}
                        · {s.parents_total} parents
                      </span>
                    </span>
                    {s.status === "synced" ? (
                      <CheckCircle2
                        size={14}
                        className="shrink-0 text-success"
                        aria-label="Synchronisée"
                      />
                    ) : (
                      <Clock
                        size={14}
                        className="shrink-0 text-accent-ink"
                        aria-label="En attente de synchronisation"
                      />
                    )}
                  </li>
                ))}
              </ul>
              {sessions.length > recentSessions.length && (
                <button
                  type="button"
                  onClick={() => router.push("/history")}
                  className="mt-2 flex h-11 w-full items-center justify-center rounded-xl border border-border text-xs font-semibold text-primary"
                >
                  Voir les {sessions.length} séances
                </button>
              )}
            </>
          )}
        </div>

        <div className="mt-4 lg:mt-6">
          <div id="lang-pills">
            <LangPills
              lang={lang}
              onLangChange={(l) => setLangMutation.mutate(l)}
            />
          </div>
        </div>

      </div>

      {/* Colonne droite : catalogue de modules */}
      <div className="mt-4 lg:mt-0">
        <p className="mb-2 flex items-center gap-1 text-sm font-semibold text-muted-foreground">
          <BookOpen size={14} aria-hidden="true" /> Modules de formation
        </p>

        {!modulesLoading && <MediaDownloadBanner modules={modules} />}

        <div
          id="module-list"
          className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4"
        >
          {modulesLoading ? (
            Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))
          ) : (
            pagedModules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                lang={lang}
                onOpen={handleOpen}
                className="lg:h-full lg:w-full"
              />
            ))
          )}
        </div>

        <ModulePagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
      </div>

      {!modulesLoading && <FacilitatorOnboardingTour />}
    </div>
  );
}
