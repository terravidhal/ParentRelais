"use client";

import { useQuery } from "@tanstack/react-query";
import { readReferenceData } from "@/lib/content/reference-data";

/**
 * Langues, régions et localités disponibles.
 *
 * Lu depuis Dexie, jamais depuis le réseau : ces listes servent dès l'écran
 * de connexion, y compris hors-ligne. Le rafraîchissement se fait par la
 * synchronisation, comme pour les modules.
 */
export function useReferenceDataQuery() {
  return useQuery({
    queryKey: ["dexie", "reference-data"],
    queryFn: readReferenceData,
    // Le référentiel change rarement : inutile de relire Dexie à chaque
    // montage de composant.
    staleTime: 5 * 60 * 1000,
  });
}
