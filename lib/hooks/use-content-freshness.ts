"use client";

import { useQuery } from "@tanstack/react-query";
import { readContentSyncedAt } from "@/lib/db/content-store";

/**
 * Date de la dernière descente de contenu réussie.
 *
 * Un facilitateur longtemps hors-ligne garde le dernier contenu reçu —
 * c'est le comportement voulu, mais il doit pouvoir le constater : sinon
 * rien ne le distingue d'un contenu à jour, et il peut animer une séance
 * sur une version périmée sans le savoir.
 */
export function useContentFreshnessQuery() {
  return useQuery({
    queryKey: ["dexie", "content-synced-at"],
    queryFn: readContentSyncedAt,
  });
}
