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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (pin.length !== 4) {
      setError("Le code PIN doit contenir 4 chiffres.");
      return;
    }

    // Première connexion : le PIN saisi devient la référence locale.
    // Connexions suivantes : le PIN doit correspondre à la session existante.
    if (existingSession && existingSession.pin !== pin) {
      setError("Code PIN incorrect.");
      return;
    }

    try {
      await saveMutation.mutateAsync({
        facilitator_id: existingSession?.facilitator_id ?? crypto.randomUUID(),
        full_name: existingSession?.full_name ?? (fullName || "Facilitateur"),
        region: existingSession?.region ?? region,
        pin,
      });
      router.push("/");
    } catch {
      setError("Impossible d'enregistrer la connexion sur cet appareil.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <p className="font-display text-xs font-semibold tracking-wide text-accent">
          PARENTRELAIS
        </p>
        <h1 className="font-display text-xl font-bold">Connexion</h1>
      </div>

      {!existingSession && (
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
          className="h-11 text-center text-lg tracking-[0.5em]"
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
    </form>
  );
}
