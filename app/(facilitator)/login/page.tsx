"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, WifiOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  useFacilitatorSessionQuery,
  useSaveFacilitatorSessionMutation,
} from "@/lib/hooks/use-facilitator-session";
import { signInFacilitator } from "@/lib/auth/facilitator-signin";
import { DemoCredentialsBanner } from "@/components/facilitator/demo-credentials-banner";
import {
  DEMO_FACILITATOR_EMAIL,
  DEMO_FACILITATOR_PASSWORD,
} from "@/lib/auth/demo-accounts";

/**
 * Même traitement que le login de l'espace de pilotage : split-screen plein
 * écran, image de contexte à gauche, formulaire à droite. L'ancienne version
 * était un formulaire nu posé dans le conteneur de l'app, avec un bandeau
 * écrasé — visuellement en retrait de tout le reste du produit.
 */
function BrandPanel() {
  return (
    <div className="relative hidden lg:block">
      <Image
        src="/images/landing/offline-device.webp"
        alt=""
        fill
        priority
        sizes="50vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-t from-primary-dark/90 via-primary-dark/60 to-primary-dark/25" />
      <div className="absolute bottom-10 left-10 right-10 text-primary-foreground">
        <p className="font-display text-sm font-semibold tracking-wide opacity-90">
          PARENTRELAIS
        </p>
        <p className="font-display mt-1 text-2xl font-bold">
          Vos modules et vos séances, même sans réseau.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { data: existingSession } = useFacilitatorSessionQuery();
  const saveMutation = useSaveFacilitatorSessionMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  // En mode récupération, on retraite comme une première connexion : un
  // nouveau facilitator_id est généré plutôt que de réutiliser l'ancien.
  // Les séances déjà écrites dans l'outbox portent leur propre facilitator_id
  // (voir lib/db/outbox.ts, addOutboxSession) et continuent de se synchroniser
  // sous leur identité d'origine, indépendamment du changement de session.
  const isFirstLoginForm = !existingSession || recoveryMode;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (pin.length !== 4) {
      setError("Le code PIN doit contenir 4 chiffres.");
      return;
    }

    // Reconnexion hors-ligne : le PIN local suffit, aucun appel réseau.
    // C'est ce qui permet à un facilitateur en zone blanche de rouvrir son
    // app indéfiniment (voir 14-PLAN-FONDATIONS.md).
    if (existingSession && !recoveryMode) {
      if (existingSession.pin !== pin) {
        setError("Code PIN incorrect.");
        return;
      }
      router.push("/home");
      return;
    }

    // Première connexion (ou récupération) : vérification du compte auprès
    // de Supabase. C'est le SEUL moment où le réseau est nécessaire.
    setSigningIn(true);
    try {
      const outcome = await signInFacilitator(email, password);
      if (!outcome.ok || !outcome.session) {
        setError(
          outcome.offline
            ? "Pas de réseau. La première connexion doit se faire en zone couverte — ensuite, votre code PIN suffira même hors-ligne."
            : (outcome.error ?? "Connexion impossible."),
        );
        return;
      }

      await saveMutation.mutateAsync({ ...outcome.session, pin });
      router.push("/home");
    } catch {
      setError("Impossible d'enregistrer la connexion sur cet appareil.");
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-2">
      <BrandPanel />

      <div className="flex min-h-screen items-start justify-center bg-muted/40 px-4 pb-10 lg:min-h-0 lg:items-center lg:py-10 lg:bg-background">
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-md flex-col gap-4"
        >
          {/* Bandeau condensé sur mobile, où le panneau latéral n'existe pas. */}
          <div className="relative -mx-4 mb-5 flex h-44 flex-col items-center justify-center gap-1 overflow-hidden text-primary-foreground lg:hidden">
            <Image
              src="/images/landing/offline-device.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-primary-dark/90 via-primary-dark/65 to-primary-dark/30" />
            <p className="font-display relative text-lg font-bold tracking-wide">
              PARENTRELAIS
            </p>
          </div>

          <div className="hidden lg:block">
            <p className="font-display text-xs font-semibold tracking-wide text-brand-accent-ink">
              PARENTRELAIS
            </p>
            <h1 className="font-display mt-1 text-2xl font-bold">
              Espace facilitateur
            </h1>
            {/* Le sous-titre doit dire la vérité de l'écran affiché : promettre
                « sans réseau » au-dessus d'un formulaire qui l'exige était une
                contradiction visible en capture. */}
            <p className="mt-1 text-sm text-muted-foreground">
              {isFirstLoginForm
                ? "Première connexion : elle a besoin du réseau, une seule fois."
                : "Votre code PIN suffit — le réseau n'est pas nécessaire."}
            </p>
          </div>

      {recoveryMode && (
        <p className="text-xs text-muted-foreground">
          Une nouvelle identité locale sera créée sur cet appareil. Vos
          séances déjà synchronisées restent disponibles côté tableau de
          bord ; vos séances en attente continueront de se synchroniser
          normalement.
        </p>
      )}

      {isFirstLoginForm && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Votre email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="aicha@exemple.org"
              className="h-12 bg-card text-base"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 bg-card text-base"
              required
            />
          </div>
          <DemoCredentialsBanner
            email={DEMO_FACILITATOR_EMAIL}
            password={DEMO_FACILITATOR_PASSWORD}
            onFill={() => {
              setEmail(DEMO_FACILITATOR_EMAIL);
              setPassword(DEMO_FACILITATOR_PASSWORD);
              setPin("1234");
            }}
          />

          {/* Dire pourquoi le réseau est nécessaire MAINTENANT et seulement
              maintenant : sans cette phrase, un facilitateur hors-ligne
              croirait l'app cassée. */}
          <p className="rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
            Cette première connexion nécessite du réseau. Ensuite, votre code
            PIN suffira — même sans connexion.
          </p>
        </>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pin">Code PIN (4 chiffres)</Label>
        <Input
          id="pin"
          type="tel"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          className="h-16 bg-card text-center text-2xl tracking-[0.5em]"
          required
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive-soft px-3 py-2.5 text-sm font-semibold text-destructive"
        >
          {error}
        </p>
      )}

      {/* État de chargement explicite : sans lui, le bouton restait inerte
          pendant le traitement et l'app paraissait figée (constat terrain
          sur réseau lent). Le bouton est aussi désactivé pour empêcher une
          double soumission. */}
      <Button
        type="submit"
        disabled={saveMutation.isPending || signingIn}
        className="h-12 font-display text-base font-semibold"
      >
        {saveMutation.isPending || signingIn ? (
          <>
            <Loader2 size={18} className="motion-safe:animate-spin" aria-hidden="true" />
            Connexion en cours…
          </>
        ) : (
          "Se connecter"
        )}
      </Button>

      {/* Rappel de ce que l'app fait : le grand vide sous le bouton n'aidait
          personne, et un facilitateur qui se connecte pour la première fois
          ignore qu'il pourra travailler sans réseau. */}
      {isFirstLoginForm && !saveMutation.isPending && !signingIn && (
        <div className="mt-1 surface">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <WifiOff size={16} className="text-primary" aria-hidden="true" />
            Fonctionne sans réseau
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Vos modules et vos séances restent sur l&apos;appareil. Tout part
            automatiquement dès que la connexion revient.
          </p>
        </div>
      )}

      {existingSession && (
        <button
          type="button"
          onClick={() => {
            setRecoveryMode((v) => !v);
            setError(null);
            setPin("");
          }}
          className="h-12 text-sm font-semibold text-primary underline-offset-2 hover:underline"
        >
          {recoveryMode ? "Annuler et revenir à la connexion" : "PIN oublié ?"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
