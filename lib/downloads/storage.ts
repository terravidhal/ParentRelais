/**
 * Protection de l'espace de stockage, reprise des garde-fous de YouTube
 * offline : quota configurable, arrêt quand l'appareil manque de place, et
 * demande de stockage persistant.
 *
 * Le point le plus important est le dernier. Vérifié en test :
 * `navigator.storage.persisted()` renvoie `false` par défaut — sans
 * demande explicite, le navigateur peut EFFACER les médias téléchargés
 * quand l'espace se réduit. Pour un facilitateur qui part en zone sans
 * réseau, perdre ses vidéos sans avertissement est un échec produit.
 */

const PERSIST_ASKED_KEY = "parentrelais_persist_asked";

export interface StorageState {
  usedBytes: number;
  quotaBytes: number;
  availableBytes: number;
  /** Le navigateur s'engage-t-il à ne pas effacer nos données ? */
  persisted: boolean;
}

export async function readStorageState(): Promise<StorageState | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
  try {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    const persisted = navigator.storage.persisted
      ? await navigator.storage.persisted()
      : false;
    return {
      usedBytes: usage,
      quotaBytes: quota,
      availableBytes: Math.max(0, quota - usage),
      persisted,
    };
  } catch {
    return null;
  }
}

/**
 * Demande au navigateur de ne pas effacer nos données.
 *
 * Chrome accorde surtout cette permission aux PWA installées et aux sites
 * très utilisés — d'où l'intérêt du bouton d'installation. Un refus n'est
 * pas une erreur : on le note pour ne pas redemander en boucle, et l'app
 * continue de fonctionner normalement.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) return false;
  try {
    if (navigator.storage.persisted && (await navigator.storage.persisted())) {
      return true;
    }
    if (window.localStorage.getItem(PERSIST_ASKED_KEY) === "true") {
      return false;
    }
    const granted = await navigator.storage.persist();
    window.localStorage.setItem(PERSIST_ASKED_KEY, "true");
    return granted;
  } catch {
    return false;
  }
}

/** Nouvelle tentative après installation de la PWA, où Chrome accepte plus volontiers. */
export async function retryPersistentStorage(): Promise<boolean> {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(PERSIST_ASKED_KEY);
  }
  return requestPersistentStorage();
}
