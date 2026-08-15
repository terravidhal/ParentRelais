import type { createClient } from "@/lib/supabase/client";
import { getPendingSessions, markSessionsSynced } from "@/lib/db/outbox";

type SupabaseClient = ReturnType<typeof createClient>;

export interface SyncResult {
  syncedCount: number;
  failedCount: number;
}

/**
 * Synchronise l'outbox vers Supabase. Fonction pure, découplée de React,
 * pour rester testable indépendamment du hook qui l'appelle.
 *
 * Règles d'idempotence (CLAUDE.md règle 4, docs/03-DATA-MODEL.md) :
 * 1. client_uuid est généré côté client à la création de la séance (jamais
 *    ici), et sert de clé d'upsert — rejouer ce sync ne crée jamais de
 *    doublon côté serveur.
 * 2. L'upsert Supabase doit réussir AVANT tout marquage local "synced".
 * 3. Si le marquage local échoue après un upsert réussi, l'outbox reste
 *    "pending" : le prochain sync ré-upserte les mêmes lignes sans créer de
 *    doublon (idempotent), au prix d'un appel réseau redondant seulement —
 *    jamais d'une perte de donnée.
 */
export async function syncOutbox(
  supabase: SupabaseClient,
): Promise<SyncResult> {
  const pending = await getPendingSessions();
  if (pending.length === 0) {
    return { syncedCount: 0, failedCount: 0 };
  }

  const rows = pending.map((s) => ({
    client_uuid: s.client_uuid,
    facilitator_id: s.facilitator_id,
    module_id: s.module_id,
    region: s.region,
    locality: s.locality,
    parents_total: s.parents_total,
    women: s.women,
    disability_count: s.disability_count,
    quiz_score: s.quiz_score,
    quiz_max: s.quiz_max,
    held_at: s.held_at,
  }));

  const { data, error } = await supabase
    .from("sessions")
    .upsert(rows, { onConflict: "client_uuid", ignoreDuplicates: false })
    .select("client_uuid");

  if (error) {
    // Rien n'est marqué "synced" : l'outbox reste intact pour un prochain essai.
    throw new Error("Synchronisation Supabase échouée", { cause: error });
  }

  const confirmedUuids = (data ?? []).map((r) => r.client_uuid);
  await markSessionsSynced(confirmedUuids);

  return {
    syncedCount: confirmedUuids.length,
    failedCount: pending.length - confirmedUuids.length,
  };
}
