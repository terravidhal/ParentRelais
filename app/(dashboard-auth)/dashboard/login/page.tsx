"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

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
        setError("Impossible d'envoyer le lien de réinitialisation.");
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
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
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
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
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
  );
}
