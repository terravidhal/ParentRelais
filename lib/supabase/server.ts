import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * Client Supabase serveur — réservé aux server components sous (dashboard).
 * Ne JAMAIS importer ce module depuis une route (facilitator) : ces routes
 * sont 100% client et ne doivent dépendre d'aucun fetch serveur au chargement
 * (CLAUDE.md règle 1).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Appelé depuis un Server Component sans possibilité d'écrire
            // des cookies (pas de middleware de refresh de session ici en
            // Phase 0) — sans conséquence tant qu'un middleware ne gère pas
            // le refresh de session utilisateur.
          }
        },
      },
    },
  );
}
