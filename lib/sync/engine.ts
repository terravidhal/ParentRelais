import type { createClient } from "@/lib/supabase/client";
import { getPendingSessions, markSessionsSynced } from "@/lib/db/outbox";
import { readFacilitatorSession } from "@/lib/db/meta";
import { fetchPublishedModules } from "@/lib/content/fetch-content";
import { replaceModules } from "@/lib/db/content-store";

type SupabaseClient = ReturnType<typeof createClient>;

export interface SyncResult {
  syncedCount: number;
  failedCount: number;
}

/**
 * Upsert la ligne d'identité facilitateur courante (nom, région) — voir
 * supabase/migrations/0009_facilitators_table.sql. Un échec ici est loggé
 * mais ne bloque JAMAIS la synchro des séances (partie chargée de sens du
 * produit) : contrairement à l'outbox, il n'y a qu'une identité courante à
 * synchroniser à chaque cycle, pas une file d'éléments distincts — un échec
 * silencieux est simplement retenté au prochain cycle, sans perte.
 */
async function syncFacilitatorIdentity(supabase: SupabaseClient): Promise<void> {
  const session = await readFacilitatorSession();
  if (!session) return;

  const { error } = await supabase.from("facilitators").upsert(
    {
      facilitator_id: session.facilitator_id,
      full_name: session.full_name,
      region: session.region,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "facilitator_id" },
  );

  if (error) {
    console.error("[sync] upsert facilitators échoué:", error);
  }
}

/**
 * Descente du contenu : récupère le catalogue publié et met à jour Dexie.
 *
 * C'est ce qui rend vraie la promesse « ajouter un module sans toucher au
 * code » : le contenu ne vit plus dans le bundle mais dans Supabase, et
 * chaque passage en ligne le rafraîchit.
 *
 * Comme l'upsert d'identité ci-dessus, un échec est loggé mais ne bloque
 * JAMAIS la montée des séances : le facilitateur garde le dernier contenu
 * reçu, et la descente est retentée au cycle suivant. L'outbox n'est jamais
 * touchée ici (CLAUDE.md règle 4).
 */
export async function syncContent(supabase: SupabaseClient): Promise<void> {
  try {
    const modules = await fetchPublishedModules(supabase);
    await replaceModules(modules);
  } catch (error: unknown) {
    console.error("[sync] descente du contenu échouée:", error);
  }
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
  await syncFacilitatorIdentity(supabase);
  await syncContent(supabase);

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
