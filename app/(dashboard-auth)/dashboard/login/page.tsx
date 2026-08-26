"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, Eye, EyeOff, Loader2, Wifi } from "lucide-react";
import { LogoMark } from "@/components/ui/logo-mark";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { DemoCredentialsBanner } from "@/components/facilitator/demo-credentials-banner";
import {
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
} from "@/lib/auth/demo-accounts";

/**
 * Panneau de marque illustré — visible seulement à lg: (split-screen desktop,
 * premier écran vu par le jury). Sur mobile, la mise en page centrée actuelle
 * suffit déjà (pas de contrainte de carte-téléphone comme côté facilitateur,
 * voir app/(facilitator)/layout.tsx pour ce choix différent).
 */
function BrandPanel() {
  return (
    <div className="relative hidden lg:block">
      <Image
        src="/images/landing/hero.webp"
        alt=""
        fill
        priority
        sizes="50vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-t from-brand-accent/90 via-brand-accent/50 to-brand-accent/20" />
      <div className="absolute bottom-10 left-10 right-10 text-primary-foreground">
        <p className="font-display flex items-center gap-2 text-sm font-semibold tracking-wide opacity-90">
          <LogoMark className="h-5 w-5" />
          PARENTRELAIS
        </p>
        <p className="font-display mt-1 text-2xl font-bold">
          Le suivi du programme, en un coup d&apos;œil.
        </p>
      </div>
    </div>
  );
}

export default function DashboardLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "reset">("signin");
  // Pré-remplis d'emblée : le jury teste les deux espaces, et recopier des
  // identifiants sur téléphone est une friction inutile.
  const [email, setEmail] = useState(DEMO_ADMIN_EMAIL);
  const [password, setPassword] = useState(DEMO_ADMIN_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        // Une panne réseau ne doit JAMAIS être présentée comme un refus
        // d'identifiants : c'est ce que voyait un juré en mode avion, alors
        // que son mot de passe était parfaitement valide.
        const isNetwork =
          signInError.name === "AuthRetryableFetchError" ||
          signInError.message.toLowerCase().includes("fetch");
        setError(
          isNetwork
            ? "Pas de réseau. L'espace de pilotage a besoin d'une connexion : il affiche des données nationales en temps réel."
            : "Identifiants incorrects.",
        );
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      // fetch() rejette hors-ligne : c'est le réseau, pas les identifiants.
      setError(
        "Pas de réseau. L'espace de pilotage a besoin d'une connexion : il affiche des données nationales en temps réel.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/dashboard/reset-password` },
      );
      if (resetError) {
        // Vérifié contre Supabase : une adresse dont le domaine n'existe pas
        // (comme les comptes de démonstration en @parentrelais.app) est
        // rejetée en `email_address_invalid`. Le message générique laissait
        // croire à une panne alors que la cause est l'adresse elle-même.
        setError(
          resetError.code === "email_address_invalid"
            ? "Cette adresse n'est pas reconnue comme une adresse email valide. Les comptes de démonstration ne peuvent pas recevoir de lien : utilisez une adresse réelle."
            : "Impossible d'envoyer le lien de réinitialisation. Réessayez dans un instant.",
        );
        return;
      }
      setResetSent(true);
    } catch {
      setError("Impossible d'envoyer le lien de réinitialisation.");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "reset") {
    return (
      <div className="lg:grid lg:min-h-screen lg:grid-cols-2">
        <BrandPanel />
        <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10 lg:min-h-0 lg:bg-background">
          <div className="w-full max-w-md surface-raised">
            <p className="font-display mb-1 flex items-center gap-2 text-xs font-semibold tracking-wide text-brand-accent">
              <LogoMark className="h-5 w-5" />
              PARENTRELAIS
            </p>
            <h1 className="font-display mb-6 text-xl font-bold">
              Mot de passe oublié
            </h1>
            {resetSent ? (
              <p className="text-sm text-muted-foreground">
                Si un compte existe pour cette adresse, un email avec un lien de
                réinitialisation vient d&apos;être envoyé.
              </p>
            ) : (
              <form onSubmit={handleResetRequest} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                    required
                  />
                </div>
                {error && (
                  <p role="alert" className="text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}
                <Button type="submit" disabled={loading} className="h-11 font-semibold">
                  {loading ? (
                <>
                  <Loader2
                    size={17}
                    aria-hidden="true"
                    className="motion-safe:animate-spin"
                  />
                  Envoi…
                </>
              ) : (
                "Envoyer le lien"
              )}
                </Button>
              </form>
            )}
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
                setResetSent(false);
              }}
              className="mt-4 h-11 text-xs font-semibold text-primary underline-offset-2 hover:underline"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-2">
      <BrandPanel />
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10 lg:min-h-0 lg:bg-background">
        <div className="w-full max-w-md surface-raised">
          {/* Sans ce lien, l'écran de connexion est une impasse. */}
          <Link
            href="/"
            className="mb-3 flex h-11 items-center gap-1 self-start text-sm font-semibold text-primary"
          >
            <ChevronLeft size={16} aria-hidden="true" /> Accueil
          </Link>

          <p className="font-display mb-1 flex items-center gap-2 text-xs font-semibold tracking-wide text-brand-accent">
            <LogoMark className="h-5 w-5" />
            PARENTRELAIS
          </p>
          <h1 className="font-display mb-2 text-xl font-bold">
            Tableau de bord — Connexion
          </h1>

          {/* Dit AVANT la tentative, pas seulement après l'échec : un juré en
              mode avion voyait « identifiants incorrects » alors que son mot
              de passe était valide. */}
          <p className="mb-4 flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
            <Wifi size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            <span>
              <span className="font-semibold text-foreground">
                Cet espace nécessite une connexion internet.
              </span>{" "}
              Il affiche des données nationales en temps réel. Le mode
              hors-ligne concerne l&apos;espace facilitateur.
            </span>
          </p>

          {/* Le même bandeau que côté facilitateur : le jury teste les deux
              espaces, et n'avoir les identifiants que d'un seul côté était
              une asymétrie gênante. */}
          <div className="mb-4">
            <DemoCredentialsBanner
              email={DEMO_ADMIN_EMAIL}
              password={DEMO_ADMIN_PASSWORD}
              onFill={() => {
                setEmail(DEMO_ADMIN_EMAIL);
                setPassword(DEMO_ADMIN_PASSWORD);
              }}
            />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  className="absolute inset-y-0 right-0 flex h-11 w-11 items-center justify-center text-muted-foreground"
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
            {error && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading} className="h-11 font-semibold">
              {loading ? (
                <>
                  <Loader2
                    size={17}
                    aria-hidden="true"
                    className="motion-safe:animate-spin"
                  />
                  Connexion…
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
            {/* Désactivé pendant l'évaluation : Supabase refuse d'envoyer un
                lien vers une adresse dont le domaine n'existe pas, ce qui est
                le cas des comptes de démonstration (@parentrelais.app). Un
                bouton grisé et expliqué vaut mieux qu'un lien qui échoue. */}
            <p className="text-center text-xs text-muted-foreground">
              <span className="font-semibold">Mot de passe oublié ?</span>{" "}
              Indisponible pour les comptes de démonstration — le mot de passe
              se change depuis « Mon profil » une fois connecté.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
