import { db } from "./dexie";
import { SEED_MODULES } from "@/lib/content/seed";

/**
 * Peuple Dexie avec le contenu de démo au tout premier lancement. En Phase 1,
 * ceci sera remplacé par un vrai fetch initial depuis Supabase (pull de
 * contenu, voir docs/02-ARCHITECTURE.md) suivi d'un cache — la fonction reste
 * volontairement idempotente (ne réinsère rien si des modules existent déjà).
 */
export async function ensureSeeded(): Promise<void> {
  try {
    const count = await db.modules.count();
    if (count > 0) return;
    await db.modules.bulkAdd(SEED_MODULES);
  } catch (error: unknown) {
    console.error("[seed] échec du seed initial des modules:", error);
    throw new Error("Impossible d'initialiser le contenu local", {
      cause: error,
    });
  }
}
