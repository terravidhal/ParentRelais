"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, History, Settings2 } from "lucide-react";
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
import { useAutoQueueDownloads } from "@/lib/hooks/use-auto-queue-downloads";
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
  useAutoQueueDownloads(modules);

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace("/login");
    }
  }, [sessionLoading, session, router]);

  const handleOpen = (module: CachedModule) => {
    router.push(`/modules/${module.id}`);
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

        <button
          type="button"
          onClick={() => router.push("/history")}
          className="mt-1 flex h-11 items-center gap-1.5 text-sm font-semibold text-primary underline-offset-2 hover:underline"
        >
          <History size={16} aria-hidden="true" /> Mes séances →
        </button>

        {recentSessions.length > 0 && (
          <div className="mt-2 flex flex-col gap-2">
            {recentSessions.map((s) => (
              <div
                key={s.client_uuid}
                className="rounded-xl border border-border bg-background p-2.5 text-xs"
              >
                <p className="font-display font-semibold">{s.locality}</p>
                <p className="text-muted-foreground">
                  {new Date(s.held_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                  })}{" "}
                  · Module {s.module_id}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 lg:mt-6">
          <div id="lang-pills">
            <LangPills
              lang={lang}
              onLangChange={(l) => setLangMutation.mutate(l)}
            />
          </div>
        </div>

        {/* Résumé local dérivé de sessions (déjà chargé ci-dessus via
            useAllSessionsQuery) — aucun nouveau fetch, occupe l'espace
            disponible de la colonne en desktop sans dépendre du réseau. */}
        {sessions.length > 0 && (
          <div className="mt-4 hidden rounded-2xl border border-border bg-background p-3 lg:block">
            <p className="font-display text-xs font-semibold text-muted-foreground">
              Résumé local
            </p>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Séances enregistrées</span>
              <span className="font-display font-semibold">{sessions.length}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">En attente de synchro</span>
              <span className="font-display font-semibold">
                {sessions.filter((s) => s.status === "pending").length}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Colonne droite : catalogue de modules */}
      <div className="mt-4 lg:mt-0">
        <p className="mb-2 flex items-center gap-1 text-sm font-semibold text-muted-foreground">
          <BookOpen size={14} aria-hidden="true" /> Modules de formation
        </p>

        {!modulesLoading && <MediaDownloadBanner />}

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
