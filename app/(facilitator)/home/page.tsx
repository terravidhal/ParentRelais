"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Search, CheckCircle2, Clock, History, Settings2 } from "lucide-react";
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
import { FieldReadiness } from "@/components/facilitator/field-readiness";
import { collectMediaUrls } from "@/lib/downloads/collect-media";
import { useMediaDownloadsQuery } from "@/lib/hooks/use-media-downloads-query";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { FacilitatorOnboardingTour } from "@/components/facilitator/onboarding-tour";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeading } from "@/components/ui/page-heading";
import type { CachedModule } from "@/lib/db/dexie";

// 2 colonnes × 3 lignes à desktop (lg:), pile de 6 sur mobile — page size
// fixe plutôt que dépendante du viewport pour rester simple côté offline.
const PAGE_SIZE = 6;

/** L'app tourne-t-elle en mode installé (PWA) plutôt que dans un onglet ? */
function readIsInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari iOS expose l'état standalone hors standard.
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function subscribeToDisplayMode(onChange: () => void): () => void {
  const query = window.matchMedia("(display-mode: standalone)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export default function HomePage() {
  const router = useRouter();
  const { data: session, isLoading: sessionLoading } = useFacilitatorSessionQuery();
  const { data: modules = [], isLoading: modulesLoading } = useModulesQuery();
  const { data: sessions = [] } = useAllSessionsQuery();
  const { data: lang = "fr" } = usePreferredLangQuery();
  const setLangMutation = useSetPreferredLangMutation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"position" | "duree">("position");

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace("/login");
    }
  }, [sessionLoading, session, router]);

  const handleOpen = (module: CachedModule) => {
    router.push(`/module?id=${module.id}`);
  };

  // Recherche et tri : avec 8 modules et plus à venir, parcourir deux pages
  // pour retrouver un titre précis devient pénible sur un petit écran.
  // Le tri par durée sert le terrain : un facilitateur qui n'a que 40 minutes
  // doit pouvoir repérer un module court.
  const visibleModules = modules
    .filter((m) => {
      if (!search.trim()) return true;
      const needle = search.trim().toLowerCase();
      return m.translations.some(
        (t) =>
          t.title.toLowerCase().includes(needle) ||
          t.summary.toLowerCase().includes(needle),
      );
    })
    .sort((a, b) =>
      sortBy === "duree" ? a.duration_min - b.duration_min : a.position - b.position,
    );

  const pageCount = Math.max(1, Math.ceil(visibleModules.length / PAGE_SIZE));
  // Dérivé plutôt que corrigé via un effet : si le nombre de modules baisse
  // (ex. après un reset de contenu), la page courante peut dépasser le
  // nouveau pageCount le temps d'un rendu — on la ramène ici, sans setState.
  const currentPage = Math.min(page, pageCount);
  const pagedModules = visibleModules.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const syncedCount = sessions.filter((s) => s.status === "synced").length;
  const pendingCount = sessions.length - syncedCount;

  // Préparation au terrain : ce qui manque encore sur l'appareil avant de
  // partir en zone sans réseau.
  const online = useOnlineStatus();
  const { data: downloads = [] } = useMediaDownloadsQuery();
  const downloadedUrls = new Set(
    downloads.filter((d) => d.status === "done").map((d) => d.media_url),
  );
  const missingMediaCount = new Set(
    collectMediaUrls(modules)
      .map((m) => m.media_url)
      .filter((url) => !downloadedUrls.has(url)),
  ).size;
  // `useSyncExternalStore` plutôt qu'un effet : conçu exactement pour lire
  // une valeur extérieure à React sans incohérence d'hydratation (le
  // troisième argument fournit la valeur côté serveur) ni cascade de rendus.
  const installed = useSyncExternalStore(
    subscribeToDisplayMode,
    readIsInstalled,
    () => false,
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

        {!modulesLoading && (
          <div className="mb-3">
            <FieldReadiness
              pendingCount={pendingCount}
              missingMediaCount={missingMediaCount}
              installed={installed}
              online={online}
            />
          </div>
        )}
        {/* La bannière de téléchargement ne s'affiche QUE si la préparation
            au terrain n'en parle pas déjà : les deux annonçaient « 9 fichiers
            à télécharger » l'un sous l'autre (constaté en capture). */}
        {!modulesLoading && missingMediaCount === 0 && (
          <MediaDownloadBanner modules={modules} />
        )}

        {/* Recherche et tri — masqués tant qu'il y a peu de modules : sur un
            petit écran, une barre inutile coûte de la place au contenu. */}
        {!modulesLoading && modules.length > PAGE_SIZE && (
          <div className="mb-3 flex flex-wrap items-end gap-2">
            <label className="flex min-w-[180px] flex-1 flex-col gap-1 text-xs font-semibold">
              Rechercher un module
              <span className="relative">
                <Search
                  size={16}
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Titre ou sujet"
                  className="h-12 w-full rounded-2xl border border-border bg-background pl-10 pr-3 text-base font-normal"
                />
              </span>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold">
              Trier par
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as "position" | "duree");
                  setPage(1);
                }}
                className="h-12 rounded-2xl border border-border bg-background px-3 text-base font-normal"
              >
                <option value="position">Ordre du programme</option>
                <option value="duree">Durée (du plus court)</option>
              </select>
            </label>
          </div>
        )}

        {!modulesLoading && search.trim() && visibleModules.length === 0 && (
          <p className="mb-3 rounded-2xl border border-border bg-background p-3 text-sm text-muted-foreground">
            Aucun module ne correspond à «&nbsp;{search.trim()}&nbsp;».
          </p>
        )}

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
