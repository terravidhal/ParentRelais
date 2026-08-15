"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db/dexie";

const SESSION_KEY = "facilitator_session";

export interface FacilitatorSession {
  facilitator_id: string;
  full_name: string;
  region: string;
  pin: string;
}

export function useFacilitatorSessionQuery() {
  return useQuery<FacilitatorSession | null>({
    queryKey: ["dexie", "meta", SESSION_KEY],
    queryFn: async () => {
      try {
        const row = await db.meta.get(SESSION_KEY);
        return row ? (JSON.parse(row.value) as FacilitatorSession) : null;
      } catch (error: unknown) {
        console.error("[meta] lecture de la session facilitateur échouée:", error);
        return null;
      }
    },
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
    mutationFn: async (session: FacilitatorSession) => {
      try {
        await db.meta.put({ key: SESSION_KEY, value: JSON.stringify(session) });
      } catch (error: unknown) {
        throw new Error("Impossible d'enregistrer la session facilitateur", {
          cause: error,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dexie", "meta", SESSION_KEY] });
    },
  });
}
