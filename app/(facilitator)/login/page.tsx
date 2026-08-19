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
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 lg:mx-auto lg:max-w-sm"
    >
      {/* Bandeau de marque illustré — remplace l'aplat de couleur unie par
          une image contextuelle (terrain hors-ligne), teinté brand-accent
          conformément à l'usage documenté de ce token dans globals.css
          ("réservé aux surfaces de marque... bandeaux de connexion"). */}
      <div className="relative -mx-5 -mt-5 flex h-36 flex-col items-center justify-center gap-1 overflow-hidden text-primary-foreground lg:h-44">
        <Image
          src="/images/landing/offline-device.webp"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 384px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-brand-accent/90 via-brand-accent/70 to-brand-accent/40" />
        <p className="font-display relative text-lg font-bold tracking-wide">PARENTRELAIS</p>
        <p className="relative text-xs opacity-90">Connexion facilitateur</p>
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
              className="h-12 bg-card text-base"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="region">Région</Label>
            <select
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="h-12 w-full rounded-lg border border-input bg-card px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
        disabled={saveMutation.isPending}
        className="h-12 font-display text-base font-semibold"
      >
        {saveMutation.isPending ? (
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
      {isFirstLoginForm && !saveMutation.isPending && (
        <div className="mt-1 rounded-2xl border border-border bg-card p-3">
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
  );
}
