import type { createClient } from "@/lib/supabase/client";
import type {
  CachedModule,
  CachedModuleTranslation,
  CachedQuizQuestion,
} from "@/lib/db/dexie";

type SupabaseClient = ReturnType<typeof createClient>;

/**
 * Récupère le catalogue depuis Supabase, seule source de vérité du contenu.
 *
 * Remplace l'ancien seed en dur (lib/content/seed.ts) : un module créé dans
 * l'espace de pilotage doit atteindre les téléphones sans qu'on touche au
 * code, ce qu'un catalogue figé dans le bundle rendait impossible.
 *
 * Ne récupère que les modules publiés et non archivés — un brouillon reste
 * invisible du terrain (voir migration 0014).
 */
export async function fetchPublishedModules(
  supabase: SupabaseClient,
): Promise<CachedModule[]> {
  const { data: modules, error: modulesError } = await supabase
    .from("modules")
    .select("id, position, duration_min")
    .eq("status", "published")
    .is("archived_at", null)
    .order("position");

  if (modulesError) {
    throw new Error("Lecture des modules échouée", { cause: modulesError });
  }
  if (!modules || modules.length === 0) return [];

  const { data: translations, error: translationsError } = await supabase
    .from("module_translations")
    .select("module_id, lang, title, summary, key_points, audio_url, video_url, subtitles_url, status")
    .in(
      "module_id",
      modules.map((m) => m.id),
    );

  if (translationsError) {
    throw new Error("Lecture des traductions échouée", {
      cause: translationsError,
    });
  }

  // Le quiz descend AVEC les modules : il vivait auparavant en dur dans le
  // bundle, sans lien avec module_id, si bien que tout module affichait les
  // mêmes questions (voir migration 0019).
  const moduleIds = modules.map((m) => m.id);
  const { data: questions, error: questionsError } = await supabase
    .from("quiz_questions")
    .select("id, module_id, position, correct_index")
    .in("module_id", moduleIds)
    .order("position");

  if (questionsError) {
    throw new Error("Lecture du quiz échouée", { cause: questionsError });
  }

  const questionIds = (questions ?? []).map((q) => q.id);
  const { data: questionTranslations, error: quizTradError } =
    questionIds.length > 0
      ? await supabase
          .from("quiz_question_translations")
          .select("question_id, lang, question, options")
          .in("question_id", questionIds)
      : { data: [], error: null };

  if (quizTradError) {
    throw new Error("Lecture des traductions du quiz échouée", {
      cause: quizTradError,
    });
  }

  const quizByModule = new Map<number, CachedQuizQuestion[]>();
  for (const q of questions ?? []) {
    const list = quizByModule.get(q.module_id) ?? [];
    list.push({
      id: q.id,
      position: q.position,
      correct_index: q.correct_index,
      translations: (questionTranslations ?? [])
        .filter((t) => t.question_id === q.id)
        .map((t) => ({
          lang: t.lang,
          question: t.question,
          options: t.options ?? [],
        })),
    });
    quizByModule.set(q.module_id, list);
  }

  const byModule = new Map<number, CachedModuleTranslation[]>();
  for (const t of translations ?? []) {
    const list = byModule.get(t.module_id) ?? [];
    list.push({
      lang: t.lang,
      title: t.title,
      summary: t.summary,
      key_points: t.key_points ?? [],
      audio_url: t.audio_url ?? undefined,
      video_url: t.video_url ?? undefined,
      subtitles_url: t.subtitles_url ?? undefined,
      status: t.status,
    });
    byModule.set(t.module_id, list);
  }

  return modules
    .map((m) => ({
      id: m.id,
      position: m.position,
      duration_min: m.duration_min,
      translations: byModule.get(m.id) ?? [],
      quiz: quizByModule.get(m.id) ?? [],
    }))
    // Un module sans aucune traduction serait inaffichable côté facilitateur
    // (module-view retombe sur "fr" et planterait sans elle).
    .filter((m) => m.translations.some((t) => t.lang === "fr"));
}
