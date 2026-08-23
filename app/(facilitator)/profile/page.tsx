"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ChevronLeft,
  HelpCircle,
  LogOut,
  RotateCcw,
  UserCircle2,
} from "lucide-react";
import {
  useFacilitatorSessionQuery,
  useSignOutFacilitatorMutation,
} from "@/lib/hooks/use-facilitator-session";
import { useResetContentMutation } from "@/lib/hooks/use-reset-content-mutation";
import { useContentFreshnessQuery } from "@/lib/hooks/use-content-freshness";
import { useAllSessionsQuery } from "@/lib/hooks/use-outbox-query";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeading } from "@/components/ui/page-heading";
import { InstallButton } from "@/components/facilitator/install-button";

/**
 * Profil facilitateur — déconnexion locale et filet de secours de contenu
 * (jamais le mécanisme principal : la descente automatique à chaque cycle de
 * synchro, voir syncContent dans lib/sync/engine.ts).
 */
export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isLoading: sessionLoading } = useFacilitatorSessionQuery();
  const signOutMutation = useSignOutFacilitatorMutation();
  const resetContentMutation = useResetContentMutation();
  const { data: contentSyncedAt } = useContentFreshnessQuery();
  const { data: sessions = [] } = useAllSessionsQuery();
  const [confirmingReset, setConfirmingReset] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace("/login");
    }
  }, [sessionLoading, session, router]);

  if (sessionLoading || !session) {
    return <Skeleton className="h-40 w-full" />;
  }

  const handleSignOut = async () => {
    await signOutMutation.mutateAsync();
    router.replace("/login");
  };

  const handleResetContent = async () => {
    try {
      await resetContentMutation.mutateAsync();
      setConfirmingReset(false);
    } catch {
      // Message d'erreur rendu sous le bouton : on garde la confirmation
      // ouverte pour que « Réessayer » soit à portée de doigt.
    }
  };

  return (
    <div className="lg:mx-auto lg:max-w-4xl">
      <button
        type="button"
        onClick={() => router.push("/home")}
        className="mb-3 flex h-11 items-center gap-1 text-sm font-semibold text-primary"
      >
        <ChevronLeft size={16} aria-hidden="true" /> Retour
      </button>

      <PageHeading>Mon profil</PageHeading>

      {/* Deux colonnes à lg: : qui je suis à gauche, ce que je peux faire à
          droite. Avant, tout s'empilait dans une colonne de 576px centrée
          dans 432px de vide de chaque côté (mesuré). */}
      <div className="mt-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
      <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 surface">
        <div className="font-display flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft font-bold text-accent-ink">
          {session.full_name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="font-display text-sm font-semibold">{session.full_name}</p>
          <p className="text-xs text-muted-foreground">{session.region}</p>
        </div>
      </div>

      <div className="surface">
        <p className="flex items-center gap-2 font-display text-sm font-semibold">
          <UserCircle2 size={16} className="text-accent-ink" aria-hidden="true" />
          Informations
        </p>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Séances animées</span>
          <span className="font-display font-semibold">{sessions.length}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Informations complémentaires à venir.
        </p>
      </div>

      </div>

      <div className="mt-3 flex flex-col gap-3 lg:mt-0">
      <button
        type="button"
        onClick={() => router.push("/home?tour=1")}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border text-sm font-semibold text-foreground"
      >
        <HelpCircle size={16} className="text-accent-ink" aria-hidden="true" />
        Revoir le guide
      </button>

      {/* Le navigateur ne propose l'installation qu'une seule fois et ne
          revient pas dessus pendant des mois : sans ce bouton, un
          facilitateur qui rate la bannière ne peut plus jamais installer
          l'app. Ne s'affiche que si l'installation est possible. */}
      <InstallButton />

      <button
        type="button"
        onClick={handleSignOut}
        disabled={signOutMutation.isPending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 text-sm font-semibold text-destructive disabled:opacity-50"
      >
        <LogOut size={16} aria-hidden="true" />
        Se déconnecter
      </button>

      {/* Le risque le plus concret de perte de données, et le seul contre
          lequel l'application ne peut rien : « effacer les données de
          navigation » supprime Dexie, donc les séances non synchronisées. */}
      <div className="surface border-accent/40 bg-accent/10">
        <p className="flex items-center gap-2 font-display text-sm font-semibold text-accent-ink">
          <AlertTriangle size={16} aria-hidden="true" />
          Ne videz pas les données du navigateur
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Vos séances en attente sont stockées sur l&apos;appareil. Effacer les
          données de navigation ou désinstaller l&apos;application les
          supprimerait définitivement. Synchronisez avant toute manipulation.
        </p>
      </div>

      <div className="surface">
        <p className="flex items-center gap-2 font-display text-sm font-semibold">
          <RotateCcw size={16} className="text-accent-ink" aria-hidden="true" />
          Réinitialiser le contenu
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Recharge les modules de formation depuis leur dernière version.
          Cette action ne touche pas vos séances enregistrées ni vos séances
          en attente de synchronisation.
        </p>

        {/* Fraîcheur du contenu : sans cette date, rien ne distingue un
            contenu à jour d'un contenu reçu il y a trois semaines. */}
        <p className="mt-2 text-xs font-semibold text-foreground">
          {contentSyncedAt
            ? `Contenu mis à jour le ${contentSyncedAt.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}`
            : "Contenu jamais mis à jour depuis le serveur"}
        </p>

        {resetContentMutation.isError && (
          <p className="mt-2 text-xs font-semibold text-destructive">
            Échec : contenu inchangé. Vérifiez votre connexion et réessayez.
          </p>
        )}

        {confirmingReset ? (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-xs font-semibold text-foreground">
              Confirmer la réinitialisation du contenu ?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleResetContent}
                disabled={resetContentMutation.isPending}
                className="h-11 flex-1 rounded-2xl bg-accent text-sm font-semibold text-accent-foreground disabled:opacity-50"
              >
                {resetContentMutation.isPending ? "Réinitialisation…" : "Confirmer"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingReset(false)}
                className="h-11 flex-1 rounded-2xl border border-border text-sm font-semibold"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingReset(true)}
            className="mt-3 h-11 w-full rounded-2xl border border-border text-sm font-semibold"
          >
            Réinitialiser le contenu
          </button>
        )}
      </div>
      </div>
      </div>
    </div>
  );
}
