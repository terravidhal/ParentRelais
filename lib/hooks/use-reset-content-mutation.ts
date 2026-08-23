"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fetchPublishedModules } from "@/lib/content/fetch-content";
import { replaceModules } from "@/lib/db/content-store";

/**
 * Filet de secours manuel (page profil) : redemande le catalogue au serveur
 * et remplace le contenu local. Le mécanisme principal reste automatique —
 * la descente à chaque cycle de synchro (voir syncContent dans
 * lib/sync/engine.ts).
 *
 * Contrairement à cette descente auto, ce chemin s'exécute après le montage
 * de l'app : le cache React Query des modules doit être invalidé
 * explicitement pour refléter le nouveau contenu.
 *
 * Le contenu local n'est vidé qu'APRÈS une récupération réussie : en cas
 * d'échec réseau, le facilitateur garde ses modules plutôt que de se
 * retrouver avec une app vide — ce serait la pire issue possible pour un
 * bouton présenté comme un dépannage.
 */
export function useResetContentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const modules = await fetchPublishedModules(createClient());
      if (modules.length === 0) {
        throw new Error("Aucun module publié reçu du serveur");
      }
      await replaceModules(modules);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dexie", "modules"] });
      queryClient.invalidateQueries({ queryKey: ["dexie", "content-synced-at"] });
    },
  });
}
