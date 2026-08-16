import { db } from "./dexie";
import { SEED_MODULES, SEED_VERSION } from "@/lib/content/seed";

const SEED_VERSION_KEY = "seed_version";

/**
 * Peuple Dexie avec le contenu de démo au tout premier lancement, puis
 * resynchronise automatiquement si SEED_VERSION a changé depuis (un appareil
 * déjà seedé ne doit jamais rester bloqué sur un ancien contenu). En Phase 1,
 * ceci sera remplacé par un vrai fetch initial depuis Supabase (pull de
 * contenu, voir docs/02-ARCHITECTURE.md).
 */
export async function ensureSeeded(): Promise<void> {
  try {
    const count = await db.modules.count();
    if (count === 0) {
      await db.modules.bulkAdd(SEED_MODULES);
      await db.meta.put({ key: SEED_VERSION_KEY, value: String(SEED_VERSION) });
      return;
    }

    const storedVersion = await db.meta.get(SEED_VERSION_KEY);
    if (storedVersion?.value !== String(SEED_VERSION)) {
      await resyncModuleContent();
    }
  } catch (error: unknown) {
    console.error("[seed] échec du seed initial des modules:", error);
    throw new Error("Impossible d'initialiser le contenu local", {
      cause: error,
    });
  }
}

/**
 * Remplace le contenu des modules par la version courante de SEED_MODULES.
 * La transaction ne porte que sur modules+meta : outbox (séances en attente/
 * synchronisées) est structurellement hors de portée, jamais touchée ici
 * (CLAUDE.md règle 4 — la synchro ne perd jamais de données).
 */
async function resyncModuleContent(): Promise<void> {
  await db.transaction("rw", db.modules, db.meta, async () => {
    await db.modules.clear();
    await db.modules.bulkAdd(SEED_MODULES);
    await db.meta.put({ key: SEED_VERSION_KEY, value: String(SEED_VERSION) });
  });
}

/**
 * Filet de secours manuel exposé depuis la page profil — jamais le mécanisme
 * principal (voir ensureSeeded ci-dessus, automatique). Ne touche que le
 * contenu des modules, jamais les séances de l'utilisateur.
 */
export async function forceContentReset(): Promise<void> {
  try {
    await resyncModuleContent();
  } catch (error: unknown) {
    console.error("[seed] réinitialisation manuelle du contenu échouée:", error);
    throw new Error("Impossible de réinitialiser le contenu local", {
      cause: error,
    });
  }
}
