import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Client Supabase PRIVILÉGIÉ — contourne entièrement la RLS.
 *
 * À n'utiliser QUE depuis une action serveur ou un composant serveur, et
 * uniquement pour ce que la clé publique ne peut pas faire : créer un compte
 * facilitateur, envoyer une invitation, réinitialiser un mot de passe.
 *
 * CLAUDE.md règle 5 interdit la clé privilégiée côté client. Elle est ici
 * lue depuis `SUPABASE_SECRET_KEY`, sans préfixe `NEXT_PUBLIC_` : Next.js
 * n'expose au navigateur que les variables ainsi préfixées, donc une
 * importation accidentelle depuis un composant client échouerait au build
 * plutôt que de fuiter la clé.
 *
 * Nommage : Supabase a remplacé `service_role` par les « secret keys »
 * (`sb_secret_…`). Les deux fonctionnent, la seconde est recommandée.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!secretKey) {
    // Message explicite : sans cette clé, la création de comptes échouerait
    // avec une erreur Supabase opaque ("Invalid API key") difficile à relier
    // à une variable d'environnement manquante.
    throw new Error(
      "SUPABASE_SECRET_KEY absente. Ajoutez-la dans .env.local (Supabase → Settings → API Keys → Secret keys) et dans les variables Vercel.",
    );
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secretKey,
    {
      auth: {
        // Ce client ne représente personne : il ne doit ni persister ni
        // rafraîchir une session, sinon il écraserait celle de l'admin
        // connecté dans la même requête.
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
