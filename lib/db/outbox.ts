import { db, type OutboxSession } from "./dexie";

export type NewOutboxSession = Omit<OutboxSession, "client_uuid" | "status">;

/**
 * Écrit une séance en local avec un client_uuid généré côté client — c'est
 * cette clé qui garantit l'idempotence de la synchro (voir lib/sync/engine.ts).
 * L'erreur est propagée (pas avalée) : l'appelant (mutation React Query) doit
 * pouvoir refléter l'échec à l'utilisateur.
 */
export async function addOutboxSession(
  session: NewOutboxSession,
): Promise<string> {
  const client_uuid = crypto.randomUUID();
  try {
    await db.outbox.add({
      ...session,
      client_uuid,
      status: "pending",
    });
    return client_uuid;
  } catch (error: unknown) {
    console.error("[outbox] écriture de séance échouée:", error);
    throw new Error("Impossible d'enregistrer la séance sur l'appareil", {
      cause: error,
    });
  }
}

export async function getPendingSessions(): Promise<OutboxSession[]> {
  try {
    return await db.outbox.where("status").equals("pending").toArray();
  } catch (error: unknown) {
    console.error("[outbox] lecture des séances en attente échouée:", error);
    throw new Error("Impossible de lire les séances en attente", {
      cause: error,
    });
  }
}

export async function getAllSessions(): Promise<OutboxSession[]> {
  try {
    return await db.outbox.toArray();
  } catch (error: unknown) {
    console.error("[outbox] lecture de toutes les séances échouée:", error);
    throw new Error("Impossible de lire les séances", { cause: error });
  }
}

/**
 * Marque des séances comme synchronisées SANS les supprimer — elles restent
 * disponibles pour un futur écran /history (Phase 1) sans migration de schéma.
 * Appelée uniquement après confirmation serveur (voir lib/sync/engine.ts).
 */
export async function markSessionsSynced(
  clientUuids: string[],
): Promise<void> {
  if (clientUuids.length === 0) return;
  try {
    await db.outbox.bulkUpdate(
      clientUuids.map((client_uuid) => ({
        key: client_uuid,
        changes: { status: "synced" as const },
      })),
    );
  } catch (error: unknown) {
    console.error("[outbox] marquage synced échoué:", error);
    throw new Error(
      "Séances confirmées côté serveur mais non marquées localement",
      { cause: error },
    );
  }
}

/**
 * Réattribue des séances à l'identité courante.
 *
 * Cas visé : les séances animées AVANT que le facilitateur n'ait un compte
 * Supabase portent un identifiant local, sans équivalent côté serveur. La
 * RLS les refuse définitivement (403), et comme la synchro envoie un seul
 * lot, une seule de ces lignes bloquait toutes les autres à chaque cycle.
 *
 * Ce sont ses propres séances : les lui réattribuer est la seule issue qui
 * ne perde aucune donnée (CLAUDE.md règle 4).
 */
export async function reassignSessions(
  clientUuids: string[],
  facilitatorId: string,
): Promise<void> {
  if (clientUuids.length === 0) return;
  try {
    await db.transaction("rw", db.outbox, async () => {
      for (const uuid of clientUuids) {
        await db.outbox.update(uuid, { facilitator_id: facilitatorId });
      }
    });
  } catch (error: unknown) {
    console.error("[outbox] réattribution des séances échouée:", error);
    throw new Error("Impossible de réattribuer les séances en attente", {
      cause: error,
    });
  }
}
