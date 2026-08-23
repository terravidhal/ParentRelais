"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import {
  useFacilitatorSessionQuery,
  useSignOutFacilitatorMutation,
} from "@/lib/hooks/use-facilitator-session";
import { usePendingSessionsQuery } from "@/lib/hooks/use-outbox-query";

/**
 * Déconnexion depuis l'en-tête, sans passer par le profil.
 *
 * Confirmation obligatoire quand des séances attendent d'être envoyées :
 * elles survivent à la déconnexion (l'outbox n'est jamais vidée), mais
 * l'utilisateur doit le savoir plutôt que de le supposer.
 */
export function FacilitatorSignOutButton() {
  const router = useRouter();
  const { data: session } = useFacilitatorSessionQuery();
  const { data: pending = [] } = usePendingSessionsQuery();
  const signOutMutation = useSignOutFacilitatorMutation();
  const [confirming, setConfirming] = useState(false);

  if (!session) return null;

  const handleSignOut = async () => {
    await signOutMutation.mutateAsync();
    router.replace("/login");
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        {pending.length > 0 && (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {pending.length} séance{pending.length > 1 ? "s" : ""} en attente —
            conservée{pending.length > 1 ? "s" : ""} sur l&apos;appareil.
          </span>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signOutMutation.isPending}
          className="flex h-11 items-center rounded-xl bg-destructive px-3 text-sm font-semibold text-destructive-foreground disabled:opacity-50"
        >
          Confirmer
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="flex h-11 items-center rounded-xl border border-border px-3 text-sm font-semibold"
        >
          Annuler
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label="Se déconnecter"
      className="flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-muted-foreground"
    >
      <LogOut size={16} aria-hidden="true" />
      <span className="hidden sm:inline">Déconnexion</span>
    </button>
  );
}
