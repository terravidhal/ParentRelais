"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

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
        <p className="font-display text-sm font-semibold tracking-wide opacity-90">
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        setError("Identifiants incorrects.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Connexion impossible pour le moment.");
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
            <p className="font-display mb-1 text-xs font-semibold tracking-wide text-brand-accent">
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
                  {loading ? "Envoi…" : "Envoyer le lien"}
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
          <p className="font-display mb-1 text-xs font-semibold tracking-wide text-brand-accent">
            PARENTRELAIS
          </p>
          <h1 className="font-display mb-6 text-xl font-bold">
            Tableau de bord — Connexion
          </h1>
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
              {loading ? "Connexion…" : "Se connecter"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setMode("reset");
                setError(null);
              }}
              className="h-11 text-xs font-semibold text-primary underline-offset-2 hover:underline"
            >
              Mot de passe oublié ?
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
