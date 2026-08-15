import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Client Supabase navigateur — clé anon uniquement, jamais service_role
 * (CLAUDE.md règle 5). Utilisé côté (facilitator) pour la synchro, et côté
 * client dans (dashboard) si nécessaire.
 */
export function createClient() {
  return createBrowserClient<Database, "public">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
