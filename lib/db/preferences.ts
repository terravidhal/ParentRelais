import { db } from "./dexie";

const LANG_KEY = "preferred_lang";
const DEFAULT_LANG = "fr";

/**
 * Langue préférée persistée dans Dexie.meta — même pattern que la session
 * facilitateur. Sans ça, chaque écran (Home, ModuleView, SessionView) avait
 * son propre état local réinitialisé à "fr", donc un facilitateur passant
 * l'accueil en anglais retombait en français dès qu'il ouvrait un module.
 */
export async function readPreferredLang(): Promise<string> {
  try {
    const row = await db.meta.get(LANG_KEY);
    return row?.value ?? DEFAULT_LANG;
  } catch (error: unknown) {
    console.error("[meta] lecture de la langue préférée échouée:", error);
    return DEFAULT_LANG;
  }
}

export async function savePreferredLang(lang: string): Promise<void> {
  try {
    await db.meta.put({ key: LANG_KEY, value: lang });
  } catch (error: unknown) {
    throw new Error("Impossible d'enregistrer la langue préférée", {
      cause: error,
    });
  }
}
