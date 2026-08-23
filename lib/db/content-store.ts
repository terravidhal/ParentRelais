import { db } from "./dexie";
import type { CachedModule } from "./dexie";

/** Horodatage ISO de la dernière descente de contenu réussie. */
const CONTENT_SYNCED_AT_KEY = "content_synced_at";

/**
 * Remplace le catalogue local par celui reçu du serveur.
 *
 * La transaction ne porte que sur modules+meta : l'outbox (séances en
 * attente ou synchronisées) est structurellement hors de portée, jamais
 * touchée ici — CLAUDE.md règle 4, la synchro ne perd jamais de données.
 *
 * Un catalogue vide est ignoré : mieux vaut garder le contenu précédent que
 * vider l'app parce que le serveur a répondu partiellement.
 */
export async function replaceModules(modules: CachedModule[]): Promise<void> {
  if (modules.length === 0) return;

  await db.transaction("rw", db.modules, db.meta, async () => {
    await db.modules.clear();
    await db.modules.bulkAdd(modules);
    await db.meta.put({
      key: CONTENT_SYNCED_AT_KEY,
      value: new Date().toISOString(),
    });
  });
}

/** Date de la dernière mise à jour du contenu, pour l'afficher au facilitateur. */
export async function readContentSyncedAt(): Promise<Date | null> {
  try {
    const row = await db.meta.get(CONTENT_SYNCED_AT_KEY);
    if (!row?.value) return null;
    const date = new Date(row.value);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch (error: unknown) {
    console.error("[contenu] lecture de la date de fraîcheur échouée:", error);
    return null;
  }
}

/** Y a-t-il du contenu utilisable hors-ligne ? */
export async function hasLocalContent(): Promise<boolean> {
  try {
    return (await db.modules.count()) > 0;
  } catch (error: unknown) {
    console.error("[contenu] lecture du catalogue local échouée:", error);
    return false;
  }
}

/**
 * Filet de secours manuel exposé depuis la page profil. Vide le catalogue
 * local pour forcer une récupération complète au prochain passage en ligne.
 * Ne touche jamais aux séances de l'utilisateur.
 */
export async function clearLocalContent(): Promise<void> {
  try {
    await db.transaction("rw", db.modules, db.meta, async () => {
      await db.modules.clear();
      await db.meta.delete(CONTENT_SYNCED_AT_KEY);
    });
  } catch (error: unknown) {
    console.error("[contenu] réinitialisation locale échouée:", error);
    throw new Error("Impossible de réinitialiser le contenu local", {
      cause: error,
    });
  }
}
