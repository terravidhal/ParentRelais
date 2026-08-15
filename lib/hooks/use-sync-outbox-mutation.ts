"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { syncOutbox } from "@/lib/sync/engine";

/**
 * Pas de retry automatique : un échec réseau reste un échec visible (bouton
 * manuel ou prochain événement `online` relanceront le sync). Voir
 * app/(facilitator)/layout.tsx pour le déclenchement automatique.
 *
 * Les toasts sont ici (pas dans les composants appelants) pour que toute
 * synchronisation, automatique ou manuelle, informe l'utilisateur de la même
 * façon — l'erreur ne doit jamais rester silencieuse (elle l'était avant,
 * ce qui a caché un vrai bug RLS/FK côté Supabase).
 */
export function useSyncOutboxMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      const supabase = createClient();
      return syncOutbox(supabase);
    },
    retry: false,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["dexie", "outbox"] });
      if (result.syncedCount > 0) {
        toast.success(
          `${result.syncedCount} séance${result.syncedCount > 1 ? "s" : ""} synchronisée${result.syncedCount > 1 ? "s" : ""}.`,
        );
      }
    },
    onError: () => {
      toast.error(
        "Synchronisation impossible pour le moment. Réessayez plus tard.",
      );
    },
  });
}
