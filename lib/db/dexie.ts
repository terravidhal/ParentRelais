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

export class ParentRelaisDB extends Dexie {
  modules!: Table<CachedModule, number>;
  outbox!: Table<OutboxSession, string>;
  meta!: Table<{ key: string; value: string }, string>;

  constructor() {
    super("parentrelais");
    this.version(1).stores({
      modules: "id, position",
      outbox: "client_uuid, status",
      meta: "key",
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
