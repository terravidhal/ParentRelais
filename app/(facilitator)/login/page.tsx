"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  useFacilitatorSessionQuery,
  useSaveFacilitatorSessionMutation,
} from "@/lib/hooks/use-facilitator-session";

const REGIONS = ["Extrême-Nord", "Adamaoua", "Nord-Ouest"] as const;

export default function LoginPage() {
  const router = useRouter();
  const { data: existingSession } = useFacilitatorSessionQuery();
  const saveMutation = useSaveFacilitatorSessionMutation();

  const [fullName, setFullName] = useState("");
  const [region, setRegion] = useState<string>(REGIONS[0]);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recoveryMode, setRecoveryMode] = useState(false);

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

    // Connexion existante (hors récupération) : le PIN doit correspondre.
    if (existingSession && !recoveryMode && existingSession.pin !== pin) {
      setError("Code PIN incorrect.");
      return;
    }

    try {
      await saveMutation.mutateAsync({
        facilitator_id: isFirstLoginForm
          ? crypto.randomUUID()
          : existingSession!.facilitator_id,
        full_name: isFirstLoginForm
          ? fullName || "Facilitateur"
          : existingSession!.full_name,
        region: isFirstLoginForm ? region : existingSession!.region,
        pin,
      });
      router.push("/home");
    } catch {
      setError("Impossible d'enregistrer la connexion sur cet appareil.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 lg:mx-auto lg:max-w-sm">
      <div className="-mx-5 -mt-5 flex h-30 flex-col items-center justify-center gap-1 bg-primary-dark text-primary-foreground">
        <p className="font-display text-lg font-bold tracking-wide">PARENTRELAIS</p>
        <p className="text-xs opacity-80">Connexion facilitateur</p>
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
            <Label htmlFor="full_name">Votre nom</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Aïcha"
              className="h-11"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="region">Région</Label>
            <select
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm"
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
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
          className="h-14 text-center text-2xl tracking-[0.5em]"
          required
        />
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="h-11 font-display font-semibold">
        Se connecter
      </Button>

      {existingSession && (
        <button
          type="button"
          onClick={() => {
            setRecoveryMode((v) => !v);
            setError(null);
            setPin("");
          }}
          className="h-11 text-xs font-semibold text-primary underline-offset-2 hover:underline"
        >
          {recoveryMode ? "Annuler et revenir à la connexion" : "PIN oublié ?"}
        </button>
      )}
    </form>
  );
}
