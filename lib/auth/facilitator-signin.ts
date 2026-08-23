import { createClient } from "@/lib/supabase/client";
import type { FacilitatorSession } from "@/lib/db/meta";

export interface SignInOutcome {
  ok: boolean;
  session?: Omit<FacilitatorSession, "pin">;
  error?: string;
  /** L'échec vient du réseau, pas des identifiants. */
  offline?: boolean;
}

/**
 * Première connexion d'un facilitateur : elle vérifie son compte Supabase.
 *
 * C'est le SEUL moment où le réseau est requis. Ensuite, l'identité vit
 * localement (Dexie) et le code PIN suffit — un facilitateur en zone blanche
 * rouvre son app sans jamais toucher au réseau (voir 14-PLAN-FONDATIONS.md,
 * décision « identité locale découplée »).
 *
 * Mesuré : le cookie de session Supabase vit 400 jours et survit à une
 * coupure réseau ; un appel auth hors-ligne lève une TypeError sans détruire
 * la session. Une panne réseau ne doit donc JAMAIS être confondue avec un
 * refus d'identifiants — d'où le drapeau `offline`.
 */
export async function signInFacilitator(
  email: string,
  password: string,
): Promise<SignInOutcome> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      // `AuthRetryableFetchError` = panne réseau, pas un mauvais mot de passe.
      // Les confondre afficherait « identifiants incorrects » à quelqu'un
      // dont les identifiants sont parfaitement valides.
      const isNetwork =
        error.name === "AuthRetryableFetchError" ||
        error.message.toLowerCase().includes("fetch");
      return isNetwork
        ? { ok: false, offline: true, error: "Réseau indisponible." }
        : { ok: false, error: "Email ou mot de passe incorrect." };
    }

    if (!data.user) {
      return { ok: false, error: "Connexion impossible." };
    }

    const meta = data.user.user_metadata ?? {};
    return {
      ok: true,
      session: {
        facilitator_id: data.user.id,
        full_name: String(meta.full_name ?? "Facilitateur"),
        region: String(meta.region ?? ""),
      },
    };
  } catch (error: unknown) {
    // fetch() rejette hors-ligne : c'est un problème de réseau, jamais
    // d'identifiants.
    console.error("[auth] connexion facilitateur échouée:", error);
    return { ok: false, offline: true, error: "Réseau indisponible." };
  }
}
