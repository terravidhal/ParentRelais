"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface FacilitatorActionResult {
  ok: boolean;
  error?: string;
  /** Mot de passe provisoire à transmettre, si créé sans email d'invitation. */
  temporaryPassword?: string;
}

/**
 * Une action serveur est une route POST publique : le rendu conditionnel de
 * l'interface n'est pas une barrière de sécurité (guide Next 16). On
 * revérifie donc le rôle ici — d'autant que les actions ci-dessous
 * utilisent le client privilégié, qui contourne la RLS.
 */
async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "Session expirée. Reconnectez-vous.";

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin"
    ? null
    : "Action réservée aux administrateurs.";
}

/** Mot de passe provisoire lisible à dicter par téléphone, sans caractère ambigu. */
function generateTemporaryPassword(): string {
  // Ni 0/O ni 1/l/I : ces mots de passe sont transmis à l'oral ou recopiés
  // à la main sur un téléphone bon marché.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Crée un compte facilitateur.
 *
 * Deux chemins délibérés (voir 14-PLAN-FONDATIONS.md, 1.0bis) :
 *
 * - **Invitation par email** : le facilitateur choisit son mot de passe.
 *   L'admin n'en gère aucun — indispensable pour déployer à l'échelle.
 * - **Mot de passe provisoire** : pour un facilitateur SANS email, cas réel
 *   au Cameroun. Sans ce chemin, le blocage se découvrirait au déploiement.
 *
 * Dans les deux cas c'est l'admin qui crée — jamais d'inscription libre,
 * sinon n'importe qui se déclare facilitateur et pousse des données dans le
 * programme. C'est aussi ce que fait KoboToolbox, référence du secteur.
 */
export async function createFacilitatorAccount(
  formData: FormData,
): Promise<FacilitatorActionResult> {
  const authError = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const region = String(formData.get("region") ?? "").trim();
  const sendInvite = formData.get("send_invite") === "on";

  if (fullName.length === 0) {
    return { ok: false, error: "Le nom est obligatoire." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Adresse email invalide." };
  }
  if (region.length === 0) {
    return { ok: false, error: "La région est obligatoire." };
  }

  const admin = createAdminClient();
  const metadata = { full_name: fullName, region, role: "facilitator" };

  let userId: string;
  let temporaryPassword: string | undefined;

  if (sendInvite) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: metadata,
    });
    if (error || !data.user) {
      console.error("[facilitateurs] invitation échouée:", error);
      return {
        ok: false,
        error:
          error?.message ??
          "Invitation impossible. Vérifiez l'adresse, ou créez le compte avec un mot de passe provisoire.",
      };
    }
    userId = data.user.id;
  } else {
    temporaryPassword = generateTemporaryPassword();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      // Sans ceci le compte reste bloqué en attente de confirmation : le
      // facilitateur sans email ne pourrait jamais se connecter.
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error || !data.user) {
      console.error("[facilitateurs] création échouée:", error);
      return {
        ok: false,
        error: error?.message ?? "Création impossible. Réessayez.",
      };
    }
    userId = data.user.id;
  }

  // La ligne `facilitators` porte l'identité de terrain (nom, région). Elle
  // est créée ici plutôt qu'attendue de la première synchro : sans elle, le
  // facilitateur n'apparaîtrait dans aucun tableau avant sa première séance.
  const { error: profileError } = await admin.from("facilitators").upsert(
    {
      facilitator_id: userId,
      full_name: fullName,
      region,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "facilitator_id" },
  );

  if (profileError) {
    console.error("[facilitateurs] upsert identité échoué:", profileError);
    return {
      ok: false,
      error: "Compte créé, mais son profil de terrain n'a pas pu être enregistré.",
    };
  }

  revalidatePath("/dashboard/facilitators");
  return { ok: true, temporaryPassword };
}

/**
 * Réinitialise le mot de passe d'un facilitateur (lot 6).
 *
 * Le facilitateur n'a pas de moyen autonome de le faire : son identité de
 * travail est locale et il n'a pas forcément d'email accessible. C'est donc
 * l'admin qui déclenche, et transmet le nouveau code.
 */
export async function resetFacilitatorPassword(
  facilitatorId: string,
): Promise<FacilitatorActionResult> {
  const authError = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const temporaryPassword = generateTemporaryPassword();
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.updateUserById(facilitatorId, {
    password: temporaryPassword,
  });

  if (error) {
    console.error("[facilitateurs] réinitialisation échouée:", error);
    return { ok: false, error: "Réinitialisation impossible." };
  }

  revalidatePath("/dashboard/facilitators");
  return { ok: true, temporaryPassword };
}
