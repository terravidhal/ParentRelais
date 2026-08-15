-- Correctif : "new row violates row-level security policy" persistait sur
-- INSERT ... ON CONFLICT DO UPDATE même avec des policies INSERT et UPDATE
-- toutes deux permissives (vérifié en isolant chaque opération en SQL direct
-- avec `set role anon` : un INSERT seul passe, un UPDATE seul passe, mais
-- leur combinaison via ON CONFLICT échoue).
--
-- Cause réelle : pour détecter un conflit sur ON CONFLICT, Postgres doit
-- pouvoir lire la ligne existante — ce qui passe par la policy SELECT.
-- Aucune des deux policies SELECT existantes ("admin lit tout", "facilitateur
-- lit les siennes") ne passe pour le rôle anonyme non authentifié (is_admin()
-- est faux, auth.uid() est null). Sans policy SELECT satisfaite, Postgres ne
-- peut pas résoudre le conflit et l'opération échoue avec un message RLS
-- trompeur qui pointe vers INSERT/UPDATE alors que la cause est SELECT.

create policy "sessions: lecture anonyme pour upsert (Phase 0, voir migration)"
  on public.sessions
  for select using (true);
