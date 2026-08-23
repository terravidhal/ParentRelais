import type { createClient } from "@/lib/supabase/client";
import { db } from "@/lib/db/dexie";

type SupabaseClient = ReturnType<typeof createClient>;

export interface Language {
  code: string;
  label: string;
  short_label: string;
}

export interface Region {
  name: string;
  localities: string[];
}

export interface ReferenceData {
  languages: Language[];
  regions: Region[];
}

const REFERENCE_KEY = "reference_data";

/**
 * Référentiel : langues, régions, localités.
 *
 * Ces listes étaient codées en dur à cinq endroits pour les langues, et
 * dans l'écran de connexion pour les régions — ajouter une langue exigeait
 * de modifier le code, en contradiction avec la promesse de la landing.
 *
 * Stocké dans `meta` plutôt que dans des tables Dexie dédiées : c'est un
 * petit bloc toujours lu en entier, jamais interrogé par index. Une table
 * par entité aurait imposé une migration de schéma pour aucun gain.
 */
export async function fetchReferenceData(
  supabase: SupabaseClient,
): Promise<ReferenceData> {
  const [langsResult, regionsResult, localitiesResult] = await Promise.all([
    supabase
      .from("languages")
      .select("code, label, short_label")
      .eq("active", true)
      .order("position"),
    supabase
      .from("regions")
      .select("id, name")
      .eq("active", true)
      .order("position"),
    supabase
      .from("localities")
      .select("region_id, name")
      .eq("active", true)
      .order("position"),
  ]);

  if (langsResult.error) {
    throw new Error("Lecture des langues échouée", { cause: langsResult.error });
  }
  if (regionsResult.error) {
    throw new Error("Lecture des régions échouée", {
      cause: regionsResult.error,
    });
  }
  if (localitiesResult.error) {
    throw new Error("Lecture des localités échouée", {
      cause: localitiesResult.error,
    });
  }

  return {
    languages: langsResult.data ?? [],
    regions: (regionsResult.data ?? []).map((r) => ({
      name: r.name,
      localities: (localitiesResult.data ?? [])
        .filter((l) => l.region_id === r.id)
        .map((l) => l.name),
    })),
  };
}

/** Repli utilisé tant qu'aucun référentiel n'a été reçu du serveur. */
const FALLBACK: ReferenceData = {
  // Le français seul : c'est la langue socle, celle dont l'existence est
  // garantie par fetchPublishedModules (un module sans traduction française
  // est écarté). Lister les autres ici recréerait le codage en dur que
  // cette migration supprime.
  languages: [{ code: "fr", label: "Français", short_label: "FR" }],
  regions: [],
};

export async function readReferenceData(): Promise<ReferenceData> {
  try {
    const row = await db.meta.get(REFERENCE_KEY);
    if (!row?.value) return FALLBACK;
    const parsed = JSON.parse(row.value) as ReferenceData;
    // Un référentiel vide serait pire que le repli : plus aucune langue à
    // afficher, donc une interface inutilisable.
    return parsed.languages?.length > 0 ? parsed : FALLBACK;
  } catch (error: unknown) {
    console.error("[référentiel] lecture locale échouée:", error);
    return FALLBACK;
  }
}

export async function saveReferenceData(data: ReferenceData): Promise<void> {
  if (data.languages.length === 0) return;
  try {
    await db.meta.put({ key: REFERENCE_KEY, value: JSON.stringify(data) });
  } catch (error: unknown) {
    console.error("[référentiel] écriture locale échouée:", error);
  }
}
