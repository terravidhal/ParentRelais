"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fetchPublishedModules } from "@/lib/content/fetch-content";
import { hasLocalContent, replaceModules } from "@/lib/db/content-store";
import { db } from "@/lib/db/dexie";
import {
  fetchReferenceData,
  saveReferenceData,
} from "@/lib/content/reference-data";

export type ContentBootstrapState =
  /** Vérification du cache local en cours — bref, aucun écran dédié. */
  | "checking"
  /** Dexie est vide et on interroge Supabase : écran « Récupération… ». */
  | "fetching"
  /** Du contenu est disponible localement : l'app peut s'afficher. */
  | "ready"
  /** Dexie vide ET récupération échouée : écran d'erreur + « Réessayer ». */
  | "failed";

/**
 * Garantit qu'il y a du contenu utilisable avant d'afficher l'app.
 *
 * Remplace l'ancien `ensureSeeded()`, qui copiait un catalogue en dur du
 * bundle vers Dexie. Le contenu vient désormais de Supabase (source de
 * vérité unique), ce qui introduit un cas qui n'existait pas : la toute
 * première récupération peut échouer alors que la page s'est chargée
 * (réseau instable). D'où l'état `failed` et le bouton « Réessayer » —
 * plutôt qu'un écran vide sans explication.
 *
 * Dès qu'il existe du contenu local, l'app s'affiche immédiatement : un
 * facilitateur hors-ligne ne doit jamais attendre le réseau. Le
 * rafraîchissement se fait alors en arrière-plan via le moteur de synchro.
 */
/**
 * Récupère le référentiel s'il est absent localement.
 *
 * Silencieux et non bloquant : l'app reste utilisable sans lui (le repli
 * fournit le français). Mais sans ce rattrapage, un appareil déjà seedé
 * n'obtenait jamais les autres langues, quel que soit le temps d'attente.
 */
async function ensureReferenceData(
  queryClient: ReturnType<typeof useQueryClient>,
): Promise<void> {
  try {
    const existing = await db.meta.get("reference_data");
    if (existing?.value) return;

    await saveReferenceData(await fetchReferenceData(createClient()));
    await queryClient.invalidateQueries({ queryKey: ["dexie", "reference-data"] });
  } catch (error: unknown) {
    // Hors-ligne au premier lancement : le repli s'applique, et la synchro
    // réessaiera au retour du réseau.
    console.error("[contenu] rattrapage du référentiel échoué:", error);
  }
}

export function useContentBootstrap() {
  const [state, setState] = useState<ContentBootstrapState>("checking");
  const queryClient = useQueryClient();

  const load = useCallback(async () => {
    // Du contenu local suffit : on affiche sans attendre le réseau.
    if (await hasLocalContent()) {
      setState("ready");
      // Mais on RATTRAPE le référentiel en arrière-plan s'il manque : un
      // appareil déjà utilisé avant l'arrivée des langues en base n'en avait
      // aucun, et ce chemin était le seul à pouvoir le lui donner. Symptôme
      // constaté : une seule pastille de langue (« FR »), définitivement.
      void ensureReferenceData(queryClient);
      return;
    }

    setState("fetching");
    try {
      const modules = await fetchPublishedModules(createClient());
      if (modules.length === 0) {
        // Un catalogue vide n'est pas une erreur réseau, mais l'app n'a rien
        // à montrer : le même écran de reprise est la réponse honnête.
        setState("failed");
        return;
      }
      await replaceModules(modules);
      // Le référentiel accompagne le contenu au premier démarrage : sans
      // lui, l'écran de connexion n'aurait aucune région à proposer.
      try {
        await saveReferenceData(await fetchReferenceData(createClient()));
        await queryClient.invalidateQueries({
          queryKey: ["dexie", "reference-data"],
        });
      } catch (error: unknown) {
        console.error("[contenu] référentiel initial non reçu:", error);
      }
      // Les queries Dexie déjà montées ne verraient pas ces nouvelles lignes.
      await queryClient.invalidateQueries({ queryKey: ["dexie", "modules"] });
      setState("ready");
    } catch (error: unknown) {
      console.error("[contenu] récupération initiale échouée:", error);
      setState("failed");
    }
  }, [queryClient]);

  useEffect(() => {
    let cancelled = false;
    // `void load()` directement ici déclencherait un setState synchrone dans
    // le corps de l'effet (cascade de rendus). Le garde `cancelled` évite en
    // prime d'écrire l'état d'un composant démonté.
    void (async () => {
      if (cancelled) return;
      await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  return { state, retry: load };
}
