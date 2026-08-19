import {
  db,
  type MediaDownload,
  type MediaDownloadErrorKind,
} from "@/lib/db/dexie";
import {
  enqueueDownload,
  markDownloadDone,
  markDownloadFailed,
  updateDownloadProgress,
  type NewMediaDownload,
} from "@/lib/db/downloads";

const CACHE_NAME = "parentrelais-media";
const MAX_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = [1000, 3000, 6000];
const PROGRESS_THROTTLE_MS = 250;
/** Marge exigée en plus de la taille du fichier, pour ne pas saturer l'appareil. */
const STORAGE_SAFETY_MARGIN = 50 * 1024 * 1024;

const controllers = new Map<string, AbortController>();
let queueRunning = false;

export class DownloadError extends Error {
  kind: MediaDownloadErrorKind;
  constructor(kind: MediaDownloadErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

/** Message actionnable plutôt qu'un « Échec » opaque. */
function messageForKind(kind: MediaDownloadErrorKind): string {
  switch (kind) {
    case "network":
      return "Connexion perdue. Le téléchargement reprendra où il s'est arrêté.";
    case "storage_full":
      return "Espace insuffisant sur l'appareil. Libérez de la place puis réessayez.";
    case "not_found":
      return "Fichier introuvable sur le serveur. Prévenez votre coordinateur.";
    default:
      return "Téléchargement impossible. Réessayez plus tard.";
  }
}

/** Espace disponible estimé, `null` si le navigateur ne le fournit pas. */
export async function getStorageEstimate(): Promise<{
  usedBytes: number;
  quotaBytes: number;
  availableBytes: number;
} | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
  try {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    return { usedBytes: usage, quotaBytes: quota, availableBytes: quota - usage };
  } catch {
    return null;
  }
}

/** Octets déjà reçus pour ce fichier lors d'une tentative précédente. */
async function readResumeState(
  url: string,
): Promise<{ chunks: Blob[]; bytes: number }> {
  const row = await db.mediaChunks.get(url);
  return row ? { chunks: row.chunks, bytes: row.bytes } : { chunks: [], bytes: 0 };
}

async function persistChunks(url: string, chunks: Blob[], bytes: number) {
  await db.mediaChunks.put({
    media_url: url,
    chunks,
    bytes,
    updated_at: new Date().toISOString(),
  });
}

/**
 * Télécharge un média avec reprise réelle (HTTP Range) et l'écrit dans le
 * cache lu par la règle CacheFirst du service worker (sw.ts).
 *
 * Le support de `Range` a été vérifié sur les deux origines réellement
 * utilisées : Supabase Storage et le serveur Next répondent tous deux
 * `206 Partial Content` avec `accept-ranges: bytes`. Une coupure à 90 % ne
 * refait donc plus les 90 % déjà reçus — comportement attendu d'une app
 * offline sérieuse sur réseau instable.
 */
async function downloadToCache(
  url: string,
  onProgress: (downloaded: number, total: number | null) => void,
  signal: AbortSignal,
): Promise<void> {
  const resume = await readResumeState(url);
  const chunks: Blob[] = [...resume.chunks];
  let downloaded = resume.bytes;

  const headers: HeadersInit = {};
  if (downloaded > 0) headers.Range = `bytes=${downloaded}-`;

  let response: Response;
  try {
    response = await fetch(url, { signal, headers });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new DownloadError("network", messageForKind("network"));
  }

  if (response.status === 404) {
    // Inutile de réessayer : on purge la reprise pour ne pas garder des
    // octets orphelins d'un fichier qui n'existe plus.
    await db.mediaChunks.delete(url);
    throw new DownloadError("not_found", messageForKind("not_found"));
  }

  // Le serveur ignore Range (200 au lieu de 206) : on repart proprement de
  // zéro plutôt que de concaténer deux fois le début du fichier.
  if (downloaded > 0 && response.status !== 206) {
    chunks.length = 0;
    downloaded = 0;
  }

  if (!response.ok || !response.body) {
    throw new DownloadError("network", messageForKind("network"));
  }

  const rangeTotal = response.headers.get("content-range")?.split("/")[1];
  const totalBytes =
    (rangeTotal ? Number(rangeTotal) : null) ??
    (Number(response.headers.get("content-length")) || null);

  if (totalBytes) {
    const estimate = await getStorageEstimate();
    if (estimate && estimate.availableBytes < totalBytes + STORAGE_SAFETY_MARGIN) {
      throw new DownloadError("storage_full", messageForKind("storage_full"));
    }
  }

  const reader = response.body.getReader();
  let lastReportedAt = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(new Blob([value as BlobPart]));
      downloaded += value.byteLength;
      const now = Date.now();
      if (now - lastReportedAt > PROGRESS_THROTTLE_MS) {
        onProgress(downloaded, totalBytes);
        // Sauvegarde régulière : sans elle, fermer l'app perdrait tout.
        await persistChunks(url, chunks, downloaded);
        lastReportedAt = now;
      }
    }
  } catch (error) {
    // Conserve ce qui a été reçu pour pouvoir reprendre ensuite.
    await persistChunks(url, chunks, downloaded);
    if (signal.aborted) throw error;
    throw new DownloadError("network", messageForKind("network"));
  }

  onProgress(downloaded, totalBytes);

  const blob = new Blob(chunks);
  const cache = await caches.open(CACHE_NAME);
  try {
    await cache.put(url, new Response(blob, { headers: response.headers }));
  } catch {
    await persistChunks(url, chunks, downloaded);
    throw new DownloadError("storage_full", messageForKind("storage_full"));
  }
  // Fichier complet dans le cache : les octets de reprise ne servent plus.
  await db.mediaChunks.delete(url);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadWithRetry(item: MediaDownload): Promise<void> {
  const controller = new AbortController();
  controllers.set(item.media_url, controller);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await downloadToCache(
        item.media_url,
        (downloaded, total) => {
          void updateDownloadProgress(item.media_url, downloaded, total);
        },
        controller.signal,
      );
      await markDownloadDone(item.media_url);
      controllers.delete(item.media_url);
      return;
    } catch (error: unknown) {
      if (controller.signal.aborted) {
        controllers.delete(item.media_url);
        return;
      }
      const kind: MediaDownloadErrorKind =
        error instanceof DownloadError ? error.kind : "unknown";
      console.error(
        `[downloads] tentative ${attempt}/${MAX_ATTEMPTS} (${kind}) pour ${item.media_url}:`,
        error,
      );

      // Réessayer ne sert à rien pour ces deux causes.
      const fatal = kind === "not_found" || kind === "storage_full";
      if (fatal || attempt === MAX_ATTEMPTS) {
        await markDownloadFailed(item.media_url, messageForKind(kind), attempt, kind);
        controllers.delete(item.media_url);
        return;
      }
      await sleep(RETRY_BACKOFF_MS[attempt - 1]);
    }
  }
}

/**
 * File séquentielle (un fichier à la fois) : sur téléphone modeste, le
 * parallélisme multiplie la pression mémoire sans faire arriver le premier
 * fichier plus vite.
 */
async function processQueue(): Promise<void> {
  if (queueRunning) return;
  queueRunning = true;
  try {
    while (true) {
      const next = await db.mediaDownloads.where("status").equals("queued").first();
      if (!next) break;
      await downloadWithRetry(next);
    }
  } finally {
    queueRunning = false;
  }
}

export async function queueDownload(item: NewMediaDownload): Promise<void> {
  await enqueueDownload(item);
  void processQueue();
}

/**
 * Relance ce qui a été interrompu par une fermeture de l'app.
 * Les fichiers mis en pause par l'utilisateur ne sont jamais relancés
 * automatiquement : c'est une décision qui lui appartient.
 */
export async function resumeInterruptedDownloads(): Promise<void> {
  const stuck = await db.mediaDownloads.where("status").equals("downloading").toArray();
  for (const item of stuck) {
    await db.mediaDownloads.update(item.media_url, {
      status: "queued",
      interrupted: true,
      updated_at: new Date().toISOString(),
    });
  }
  if (stuck.length > 0) void processQueue();
}

export function pauseDownload(media_url: string): void {
  controllers.get(media_url)?.abort();
  controllers.delete(media_url);
  void db.mediaDownloads.update(media_url, {
    status: "paused",
    interrupted: false,
    updated_at: new Date().toISOString(),
  });
}

export async function pauseAllDownloads(): Promise<void> {
  const active = await db.mediaDownloads
    .where("status")
    .anyOf(["queued", "downloading"])
    .toArray();
  for (const item of active) pauseDownload(item.media_url);
}

export async function retryDownload(media_url: string): Promise<void> {
  await db.mediaDownloads.update(media_url, {
    status: "queued",
    error_message: null,
    error_kind: undefined,
    interrupted: false,
    updated_at: new Date().toISOString(),
  });
  void processQueue();
}

export async function retryAllFailed(): Promise<void> {
  const failed = await db.mediaDownloads.where("status").equals("failed").toArray();
  for (const item of failed) await retryDownload(item.media_url);
}

export async function resumeAllPaused(): Promise<void> {
  const paused = await db.mediaDownloads.where("status").equals("paused").toArray();
  for (const item of paused) await retryDownload(item.media_url);
}

export async function cancelDownload(media_url: string): Promise<void> {
  controllers.get(media_url)?.abort();
  controllers.delete(media_url);
  await db.mediaDownloads.delete(media_url);
  // Sans cette purge, les octets partiels resteraient indéfiniment en base.
  await db.mediaChunks.delete(media_url);
}

/** Supprime un média déjà téléchargé pour libérer de l'espace. */
export async function deleteDownloadedMedia(media_url: string): Promise<void> {
  const cache = await caches.open(CACHE_NAME);
  await cache.delete(media_url);
  await db.mediaDownloads.delete(media_url);
  await db.mediaChunks.delete(media_url);
}
