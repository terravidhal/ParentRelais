"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { forceContentReset } from "@/lib/db/seedDb";

/**
 * Filet de secours manuel (page profil) — le mécanisme principal de mise à
 * jour du contenu est automatique (voir ensureSeeded dans lib/db/seedDb.ts).
 * Contrairement au resync auto (qui s'exécute avant le montage de l'app),
 * ce chemin s'exécute après coup : le cache React Query des modules doit
 * être invalidé explicitement pour refléter le nouveau contenu.
 */
export function useResetContentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: forceContentReset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dexie", "modules"] });
    },
  });
}
