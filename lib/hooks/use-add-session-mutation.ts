"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addOutboxSession, type NewOutboxSession } from "@/lib/db/outbox";

/**
 * Écriture locale pure (Dexie) — pas de retry, pas d'appel réseau. C'est
 * l'écriture "outbox d'abord" de CLAUDE.md règle 4 : la séance existe
 * localement avant même de songer à la synchro.
 */
export function useAddSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NewOutboxSession) => addOutboxSession(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dexie", "outbox"] });
    },
  });
}
