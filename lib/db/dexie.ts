import Dexie, { type Table } from "dexie";

export interface CachedModuleTranslation {
  lang: string;
  title: string;
  summary: string;
  key_points: string[];
  audio_url?: string;
  video_url?: string;
  subtitles_url?: string;
  status: "ready" | "pending";
}

export interface CachedModule {
  id: number;
  position: number;
  duration_min: number;
  translations: CachedModuleTranslation[];
}

export interface OutboxSession {
  client_uuid: string;
  facilitator_id: string;
  module_id: number;
  region: string;
  locality: string;
  parents_total: number;
  women: number;
  disability_count: number;
  quiz_score: number;
  quiz_max: number;
  held_at: string;
  status: "pending" | "synced";
}

export type MediaDownloadStatus =
  | "queued"
  | "downloading"
  | "paused"
  | "done"
  | "failed";

/** Cause d'échec, pour afficher un message actionnable plutôt qu'un « Échec ». */
export type MediaDownloadErrorKind =
  | "network"
  | "storage_full"
  | "not_found"
  | "unknown";

export interface MediaDownload {
  media_url: string;
  module_id: number;
  lang: string;
  media_type: "audio" | "video" | "subtitles";
  total_bytes: number | null;
  downloaded_bytes: number;
  status: MediaDownloadStatus;
  error_message: string | null;
  /** Renseigné avec error_message ; pilote l'action proposée à l'utilisateur. */
  error_kind?: MediaDownloadErrorKind;
  attempt_count: number;
  updated_at: string;
  /**
   * Marque une interruption subie (fermeture de l'app, perte de réseau) par
   * opposition à `paused`, qui est un choix explicite de l'utilisateur. Seules
   * les interruptions sont relancées automatiquement au démarrage.
   */
  interrupted?: boolean;
}

/**
 * Octets déjà reçus, conservés hors de la ligne de suivi pour ne pas
 * recharger des mégaoctets à chaque lecture de la file.
 * Un enregistrement par fichier ; les segments sont concaténés à la fin.
 * Confirmé par test : Supabase Storage et le serveur local répondent tous
 * deux `206 Partial Content` avec `accept-ranges: bytes`, la reprise est
 * donc réellement possible (et non simulée).
 */
export interface MediaDownloadChunk {
  media_url: string;
  chunks: Blob[];
  bytes: number;
  updated_at: string;
}

export class ParentRelaisDB extends Dexie {
  modules!: Table<CachedModule, number>;
  outbox!: Table<OutboxSession, string>;
  meta!: Table<{ key: string; value: string }, string>;
  mediaDownloads!: Table<MediaDownload, string>;
  mediaChunks!: Table<MediaDownloadChunk, string>;

  constructor() {
    super("parentrelais");
    this.version(1).stores({
      modules: "id, position",
      outbox: "client_uuid, status",
      meta: "key",
    });
    this.version(2).stores({
      modules: "id, position",
      outbox: "client_uuid, status",
      meta: "key",
      mediaDownloads: "media_url, status, module_id",
    });
    // v3 : stockage des octets déjà reçus pour reprendre un téléchargement
    // interrompu au lieu de tout recommencer. Ajout additif, aucune perte
    // sur les tables existantes.
    this.version(3).stores({
      modules: "id, position",
      outbox: "client_uuid, status",
      meta: "key",
      mediaDownloads: "media_url, status, module_id",
      mediaChunks: "media_url",
    });
  }
}

export const db = new ParentRelaisDB();

/**
 * Toute opération Dexie doit être explicite sur ses erreurs (CLAUDE.md).
 * `fallback` est retourné si l'opération échoue, l'erreur est journalisée
 * pour diagnostic — jamais d'échec silencieux sans trace.
 */
export async function safeDexie<T>(
  operation: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    console.error("[dexie] opération échouée:", error);
    return fallback;
  }
}
