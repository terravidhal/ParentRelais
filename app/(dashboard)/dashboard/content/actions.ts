"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Langues pour lesquelles une case est créée à la naissance d'un module. */
const LANGS = ["fr", "en", "ff", "sign"] as const;

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Une action serveur est une route POST publique : le rendu conditionnel de
 * l'interface n'est PAS une barrière de sécurité (guide Next 16, section
 * Security). Chaque action revérifie donc le rôle, en plus des politiques
 * RLS qui restent la garantie de dernier recours côté base.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "Session expirée. Reconnectez-vous." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { supabase, error: "Action réservée aux administrateurs." };
  }
  return { supabase, error: null };
}

/**
 * Crée un module en BROUILLON, avec ses cases de traduction vides.
 *
 * Le brouillon est délibéré : un module sans audio ni traduction qui
 * descendrait aussitôt sur le terrain serait une mauvaise surprise pour le
 * facilitateur. Il devient visible seulement à la publication.
 */
export async function createModule(formData: FormData): Promise<ActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const durationMin = Number(formData.get("duration_min"));
  const position = Number(formData.get("position"));

  // Les entrées d'une action serveur sont non fiables par principe.
  if (title.length === 0) {
    return { ok: false, error: "Le titre est obligatoire." };
  }
  if (!Number.isInteger(durationMin) || durationMin <= 0 || durationMin > 480) {
    return { ok: false, error: "La durée doit être comprise entre 1 et 480 minutes." };
  }
  if (!Number.isInteger(position) || position <= 0) {
    return { ok: false, error: "La position doit être un entier positif." };
  }

  const { data: created, error: insertError } = await supabase
    .from("modules")
    .insert({ position, duration_min: durationMin })
    .select("id")
    .single();

  if (insertError || !created) {
    console.error("[contenu] création de module échouée:", insertError);
    return { ok: false, error: "Création impossible. Réessayez." };
  }

  // Les cases vides rendent la matrice utilisable immédiatement : sans
  // ligne existante, l'upload d'un média échouerait silencieusement (0 ligne
  // affectée par l'UPDATE) — c'est ce qu'avait corrigé la migration 0011.
  const { error: translationsError } = await supabase
    .from("module_translations")
    .insert(
      LANGS.map((lang) => ({
        module_id: created.id,
        lang,
        title: lang === "fr" ? title : "",
        summary: lang === "fr" ? summary : "",
        key_points: [],
        status: "pending" as const,
      })),
    );

  if (translationsError) {
    console.error("[contenu] création des traductions échouée:", translationsError);
    return {
      ok: false,
      error: "Module créé, mais ses langues n'ont pas pu être initialisées.",
    };
  }

  revalidatePath("/dashboard/content");
  return { ok: true };
}

/**
 * Publie ou dépublie un module. C'est ce statut, et lui seul, qui décide de
 * sa descente vers les téléphones (voir syncContent dans lib/sync/engine.ts).
 */
export async function setModulePublication(
  moduleId: number,
  published: boolean,
): Promise<ActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const { error } = await supabase
    .from("modules")
    .update({ status: published ? "published" : "draft" })
    .eq("id", moduleId);

  if (error) {
    console.error("[contenu] changement de statut échoué:", error);
    return { ok: false, error: "Changement de statut impossible." };
  }

  revalidatePath("/dashboard/content");
  return { ok: true };
}

/**
 * Retire un module du terrain par ARCHIVAGE, jamais par suppression : les
 * séances déjà animées référencent module_id, et supprimer la ligne rendrait
 * l'historique illisible — côté rapports comme côté facilitateur.
 *
 * Réversible : passer `archived = false` le remet en circulation.
 */
export async function setModuleArchived(
  moduleId: number,
  archived: boolean,
): Promise<ActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const { error } = await supabase
    .from("modules")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", moduleId);

  if (error) {
    console.error("[contenu] archivage échoué:", error);
    return { ok: false, error: "Archivage impossible." };
  }

  revalidatePath("/dashboard/content");
  return { ok: true };
}

/**
 * Ajoute une question au quiz d'un module.
 *
 * Le quiz descend vers les téléphones avec son module (migration 0019) :
 * une question ajoutée ici atteint le terrain à la synchronisation
 * suivante, sans toucher au code.
 */
export async function createQuizQuestion(
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const moduleId = Number(formData.get("module_id"));
  const question = String(formData.get("question") ?? "").trim();
  const options = [0, 1, 2]
    .map((i) => String(formData.get(`option_${i}`) ?? "").trim())
    .filter((o) => o.length > 0);
  const correctIndex = Number(formData.get("correct_index"));

  if (!Number.isInteger(moduleId)) {
    return { ok: false, error: "Module invalide." };
  }
  if (question.length === 0) {
    return { ok: false, error: "La question est obligatoire." };
  }
  if (options.length < 2) {
    return { ok: false, error: "Il faut au moins deux réponses possibles." };
  }
  // La bonne réponse doit désigner une option réellement saisie : sans ce
  // contrôle, une question deviendrait impossible à réussir.
  if (!Number.isInteger(correctIndex) || correctIndex >= options.length) {
    return { ok: false, error: "La bonne réponse doit être une des réponses saisies." };
  }

  const { data: existing } = await supabase
    .from("quiz_questions")
    .select("position")
    .eq("module_id", moduleId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = (existing?.[0]?.position ?? 0) + 1;

  const { data: created, error: insertError } = await supabase
    .from("quiz_questions")
    .insert({
      module_id: moduleId,
      position: nextPosition,
      correct_index: correctIndex,
    })
    .select("id")
    .single();

  if (insertError || !created) {
    console.error("[quiz] création de question échouée:", insertError);
    return { ok: false, error: "Création impossible. Réessayez." };
  }

  const { error: translationError } = await supabase
    .from("quiz_question_translations")
    .insert({ question_id: created.id, lang: "fr", question, options });

  if (translationError) {
    console.error("[quiz] création de traduction échouée:", translationError);
    return {
      ok: false,
      error: "Question créée, mais son libellé n'a pas pu être enregistré.",
    };
  }

  revalidatePath("/dashboard/content");
  return { ok: true };
}

/** Supprime une question. Le quiz n'est référencé par aucune séance : les
 *  séances ne gardent qu'un score, jamais le détail des réponses (CLAUDE.md
 *  — seuls des compteurs agrégés sont stockés). La suppression est donc sûre. */
export async function deleteQuizQuestion(
  questionId: number,
): Promise<ActionResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const { error } = await supabase
    .from("quiz_questions")
    .delete()
    .eq("id", questionId);

  if (error) {
    console.error("[quiz] suppression échouée:", error);
    return { ok: false, error: "Suppression impossible." };
  }

  revalidatePath("/dashboard/content");
  return { ok: true };
}
