import { db } from "./dexie";

const SESSION_KEY = "facilitator_session";

export interface FacilitatorSession {
  facilitator_id: string;
  full_name: string;
  region: string;
  pin: string;
}

/**
 * Logique pure extraite de lib/hooks/use-facilitator-session.ts pour rester
 * testable sans monter de composant React (les hooks restent de fins
 * wrappers React Query autour de ces fonctions).
 */
export async function readFacilitatorSession(): Promise<FacilitatorSession | null> {
  try {
    const row = await db.meta.get(SESSION_KEY);
    return row ? (JSON.parse(row.value) as FacilitatorSession) : null;
  } catch (error: unknown) {
    console.error("[meta] lecture de la session facilitateur échouée:", error);
    return null;
  }
}

export async function saveFacilitatorSession(
  session: FacilitatorSession,
): Promise<void> {
  try {
    await db.meta.put({ key: SESSION_KEY, value: JSON.stringify(session) });
  } catch (error: unknown) {
    throw new Error("Impossible d'enregistrer la session facilitateur", {
      cause: error,
    });
  }
}

/** Identité vérifiée conservée après déconnexion, pour permettre une
 *  reconnexion hors-ligne. */
const VERIFIED_KEY = "facilitator_verified";

export async function clearFacilitatorSession(): Promise<void> {
  try {
    // On mémorise l'identité AVANT de l'effacer : elle a déjà été vérifiée
    // en ligne, et le contenu est déjà sur l'appareil. Exiger un nouvel
    // appel réseau pour se reconnecter bloquait le facilitateur en zone
    // blanche — constaté sur téléphone : « la première connexion nécessite
    // du réseau » alors qu'il s'était déjà connecté et avait animé une séance.
    const current = await readFacilitatorSession();
    if (current) {
      await db.meta.put({
        key: VERIFIED_KEY,
        value: JSON.stringify({
          facilitator_id: current.facilitator_id,
          full_name: current.full_name,
          region: current.region,
        }),
      });
    }
    await db.meta.delete(SESSION_KEY);
  } catch (error: unknown) {
    throw new Error("Impossible de supprimer la session facilitateur", {
      cause: error,
    });
  }
}

/**
 * Identité déjà vérifiée sur cet appareil, s'il y en a une.
 *
 * Permet une reconnexion par simple code PIN, sans réseau : le compte a été
 * authentifié auparavant, et rien n'oblige à le revérifier pour rouvrir un
 * contenu déjà téléchargé.
 */
export async function readVerifiedIdentity(): Promise<Omit<
  FacilitatorSession,
  "pin"
> | null> {
  try {
    const row = await db.meta.get(VERIFIED_KEY);
    return row?.value
      ? (JSON.parse(row.value) as Omit<FacilitatorSession, "pin">)
      : null;
  } catch (error: unknown) {
    console.error("[meta] lecture de l'identité vérifiée échouée:", error);
    return null;
  }
}

const ONBOARDING_KEY = "onboarding_seen";

export async function readOnboardingSeen(): Promise<boolean> {
  try {
    const row = await db.meta.get(ONBOARDING_KEY);
    return row?.value === "true";
  } catch (error: unknown) {
    console.error("[meta] lecture de onboarding_seen échouée:", error);
    // Échec de lecture : on préfère ne pas réafficher le guide plutôt que
    // risquer de le montrer en boucle si le stockage local est instable.
    return true;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  try {
    await db.meta.put({ key: ONBOARDING_KEY, value: "true" });
  } catch (error: unknown) {
    console.error("[meta] écriture de onboarding_seen échouée:", error);
  }
}
