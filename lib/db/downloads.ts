import { db, type MediaDownload } from "./dexie";

export type NewMediaDownload = Pick<
  MediaDownload,
  "media_url" | "module_id" | "lang" | "media_type"
>;

/**
 * Ajoute (ou réinitialise) une entrée en file d'attente de téléchargement.
 * `put` plutôt que `add` : ré-enfiler une URL déjà connue (ex. après un
 * échec précédent purgé) remplace la ligne plutôt que de lever une erreur
 * de clé dupliquée.
 */
export async function enqueueDownload(
  download: NewMediaDownload,
): Promise<void> {
  try {
    await db.mediaDownloads.put({
      ...download,
      total_bytes: null,
      downloaded_bytes: 0,
      status: "queued",
      error_message: null,
      attempt_count: 0,
      updated_at: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("[downloads] mise en file échouée:", error);
    throw new Error("Impossible de mettre ce média en file de téléchargement", {
      cause: error,
    });
  }
}

export async function updateDownloadProgress(
  media_url: string,
  downloaded_bytes: number,
  total_bytes: number | null,
): Promise<void> {
  try {
    await db.mediaDownloads.update(media_url, {
      downloaded_bytes,
      total_bytes,
      status: "downloading",
      updated_at: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("[downloads] mise à jour de progression échouée:", error);
    throw new Error("Impossible de mettre à jour la progression", {
      cause: error,
    });
  }
}

export async function markDownloadDone(media_url: string): Promise<void> {
  try {
    await db.mediaDownloads.update(media_url, {
      status: "done",
      error_message: null,
      updated_at: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("[downloads] marquage terminé échoué:", error);
    throw new Error("Impossible de marquer ce média comme téléchargé", {
      cause: error,
    });
  }
}

export async function markDownloadFailed(
  media_url: string,
  error_message: string,
  attempt_count: number,
): Promise<void> {
  try {
    await db.mediaDownloads.update(media_url, {
      status: "failed",
      error_message,
      attempt_count,
      updated_at: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("[downloads] marquage échec échoué:", error);
    throw new Error("Impossible d'enregistrer l'échec de téléchargement", {
      cause: error,
    });
  }
}

export async function getActiveDownloads(): Promise<MediaDownload[]> {
  try {
    return await db.mediaDownloads
      .where("status")
      .anyOf(["queued", "downloading"])
      .toArray();
  } catch (error: unknown) {
    console.error("[downloads] lecture des téléchargements actifs échouée:", error);
    throw new Error("Impossible de lire les téléchargements en cours", {
      cause: error,
    });
  }
}

export async function getAllDownloads(): Promise<MediaDownload[]> {
  try {
    return await db.mediaDownloads.toArray();
  } catch (error: unknown) {
    console.error("[downloads] lecture de tous les téléchargements échouée:", error);
    throw new Error("Impossible de lire les téléchargements", {
      cause: error,
    });
  }
}
