"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface SettingsResult {
  ok: boolean;
  error?: string;
}

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

  return profile?.role === "admin"
    ? { supabase, error: null }
    : { supabase, error: "Action réservée aux administrateurs." };
}

function revalidateAll() {
  revalidatePath("/dashboard/settings");
  // La matrice de contenu et la création de facilitateur dépendent aussi du
  // référentiel : sans ceci, une langue ajoutée n'y apparaîtrait qu'après un
  // rechargement complet.
  revalidatePath("/dashboard/content");
  revalidatePath("/dashboard/facilitators");
}

/**
 * Ajoute une langue.
 *
 * C'est le geste que la landing promet : « ajouter une langue = remplir une
 * case ». Une fois créée, la langue apparaît dans la matrice de contenu, sur
 * les pastilles du facilitateur, et ses cases de traduction sont créées pour
 * tous les modules existants — sans toucher au code.
 */
export async function createLanguage(formData: FormData): Promise<SettingsResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const code = String(formData.get("code") ?? "").trim().toLowerCase();
  const label = String(formData.get("label") ?? "").trim();
  const shortLabel = String(formData.get("short_label") ?? "").trim();

  // Le code sert de clé dans module_translations : il doit rester simple et
  // stable, sinon les contenus déjà déposés deviendraient introuvables.
  if (!/^[a-z]{2,10}$/.test(code)) {
    return { ok: false, error: "Le code doit contenir 2 à 10 lettres minuscules (ex. « ewo »)." };
  }
  if (label.length === 0 || shortLabel.length === 0) {
    return { ok: false, error: "Le nom et l'abréviation sont obligatoires." };
  }

  const { data: existing } = await supabase
    .from("languages")
    .select("position")
    .order("position", { ascending: false })
    .limit(1);

  const { error } = await supabase.from("languages").insert({
    code,
    label,
    short_label: shortLabel,
    position: (existing?.[0]?.position ?? 0) + 1,
  });

  if (error) {
    console.error("[référentiel] création de langue échouée:", error);
    return {
      ok: false,
      error: error.code === "23505" ? "Ce code de langue existe déjà." : "Création impossible.",
    };
  }

  // Les cases vides pour tous les modules : sans elles, l'upload d'un média
  // échouerait silencieusement (UPDATE sur zéro ligne — voir migration 0011).
  const { data: modules } = await supabase.from("modules").select("id");
  if (modules?.length) {
    await supabase.from("module_translations").insert(
      modules.map((m) => ({
        module_id: m.id,
        lang: code,
        title: "",
        summary: "",
        key_points: [],
        status: "pending" as const,
      })),
    );
  }

  revalidateAll();
  return { ok: true };
}

/** Active ou désactive une langue. Désactiver ne perd aucun contenu : la
 *  langue disparaît de l'interface, ses traductions restent en base. */
export async function setLanguageActive(
  code: string,
  active: boolean,
): Promise<SettingsResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  if (code === "fr" && !active) {
    // Le français est la langue socle : un module sans traduction française
    // est écarté par fetchPublishedModules, donc invisible du terrain.
    return { ok: false, error: "Le français ne peut pas être désactivé : c'est la langue socle." };
  }

  const { error } = await supabase
    .from("languages")
    .update({ active })
    .eq("code", code);

  if (error) {
    console.error("[référentiel] changement d'état de langue échoué:", error);
    return { ok: false, error: "Modification impossible." };
  }

  revalidateAll();
  return { ok: true };
}

export async function createRegion(formData: FormData): Promise<SettingsResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const name = String(formData.get("name") ?? "").trim();
  if (name.length === 0) return { ok: false, error: "Le nom est obligatoire." };

  const { error } = await supabase.from("regions").insert({ name });
  if (error) {
    console.error("[référentiel] création de région échouée:", error);
    return {
      ok: false,
      error: error.code === "23505" ? "Cette région existe déjà." : "Création impossible.",
    };
  }

  revalidateAll();
  return { ok: true };
}

export async function createLocality(formData: FormData): Promise<SettingsResult> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const regionId = Number(formData.get("region_id"));
  const name = String(formData.get("name") ?? "").trim();

  if (!Number.isInteger(regionId)) return { ok: false, error: "Région invalide." };
  if (name.length === 0) return { ok: false, error: "Le nom est obligatoire." };

  const { error } = await supabase
    .from("localities")
    .insert({ region_id: regionId, name });

  if (error) {
    console.error("[référentiel] création de localité échouée:", error);
    return {
      ok: false,
      error:
        error.code === "23505"
          ? "Cette localité existe déjà dans cette région."
          : "Création impossible.",
    };
  }

  revalidateAll();
  return { ok: true };
}
