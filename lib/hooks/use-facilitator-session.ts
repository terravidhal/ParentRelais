"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  readFacilitatorSession,
  saveFacilitatorSession,
  type FacilitatorSession,
} from "@/lib/db/meta";

export type { FacilitatorSession };

const SESSION_QUERY_KEY = ["dexie", "meta", "facilitator_session"];

export function useFacilitatorSessionQuery() {
  return useQuery<FacilitatorSession | null>({
    queryKey: SESSION_QUERY_KEY,
    queryFn: readFacilitatorSession,
  });
}

/**
 * Simplification Phase 0 assumée : le PIN saisi la première fois devient la
 * référence locale ("set on first use"), sans vérification serveur. Le vrai
 * flux "1ère connexion en ligne" (docs/04-SCREENS.md) est prévu en Phase 1.
 */
export function useSaveFacilitatorSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveFacilitatorSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
    },
  });
}
