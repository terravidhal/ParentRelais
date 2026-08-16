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

export async function clearFacilitatorSession(): Promise<void> {
  try {
    await db.meta.delete(SESSION_KEY);
  } catch (error: unknown) {
    throw new Error("Impossible de supprimer la session facilitateur", {
      cause: error,
    });
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
