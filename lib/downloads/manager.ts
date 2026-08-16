import { db, type MediaDownload } from "@/lib/db/dexie";
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

const controllers = new Map<string, AbortController>();
let queueRunning = false;

/**
 * Télécharge un média en flux (Streams API) et l'écrit dans le même cache
 * que la règle CacheFirst du service worker (sw.ts) — une fois posé ici,
 * le SW le sert offline sans aucune modification côté SW.
 *
 * Risque mémoire assumé en V1 : les chunks s'accumulent en mémoire avant
 * l'écriture finale (Cache.put exige un Response complet, pas un flux
 * appendable). Mitigé par la concurrence à 1 (voir processQueue).
 */
async function downloadToCache(
  url: string,
  onProgress: (downloaded: number, total: number | null) => void,
  signal: AbortSignal,
): Promise<void> {
  const response = await fetch(url, { signal });
  if (!response.ok || !response.body) {
    throw new Error(`Téléchargement échoué (${response.status})`);
  }
  const totalBytes = Number(response.headers.get("content-length")) || null;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let downloaded = 0;
  let lastReportedAt = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    downloaded += value.byteLength;
    const now = Date.now();
    if (now - lastReportedAt > PROGRESS_THROTTLE_MS) {
      onProgress(downloaded, totalBytes);
      lastReportedAt = now;
    }
  }
  onProgress(downloaded, totalBytes);

  const blob = new Blob(chunks as BlobPart[]);
  const cache = await caches.open(CACHE_NAME);
  await cache.put(url, new Response(blob, { headers: response.headers }));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Télécharge une entrée avec retry complet (pas de reprise byte-par-byte —
 * voir plan Partie T4) jusqu'à MAX_ATTEMPTS, puis "failed" avec un message
 * honnête — jamais de boucle silencieuse.
 */
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
      console.error(
        `[downloads] tentative ${attempt}/${MAX_ATTEMPTS} échouée pour ${item.media_url}:`,
        error,
      );
      if (attempt === MAX_ATTEMPTS) {
        await markDownloadFailed(
          item.media_url,
          "Téléchargement interrompu — reprise depuis le début au prochain essai",
          attempt,
        );
        controllers.delete(item.media_url);
        return;
      }
      await sleep(RETRY_BACKOFF_MS[attempt - 1]);
    }
  }
}

/**
 * File d'attente séquentielle (1 fichier à la fois) — délibéré : la
 * concurrence multiplie la pression mémoire sur téléphone bas de gamme
 * sans bénéfice réel (voir plan Partie T5).
 */
async function processQueue(): Promise<void> {
  if (queueRunning) return;
  queueRunning = true;
  try {
    while (true) {
      const next = await db.mediaDownloads
        .where("status")
        .equals("queued")
        .first();
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

export function pauseDownload(media_url: string): void {
  controllers.get(media_url)?.abort();
  controllers.delete(media_url);
  void db.mediaDownloads.update(media_url, {
    status: "paused",
    updated_at: new Date().toISOString(),
  });
}

export async function retryDownload(media_url: string): Promise<void> {
  await db.mediaDownloads.update(media_url, {
    status: "queued",
    error_message: null,
    updated_at: new Date().toISOString(),
  });
  void processQueue();
}

export async function cancelDownload(media_url: string): Promise<void> {
  controllers.get(media_url)?.abort();
  controllers.delete(media_url);
  await db.mediaDownloads.delete(media_url);
}
