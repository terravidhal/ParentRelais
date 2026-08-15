-- Correctif : "new row violates row-level security policy" spécifiquement
-- sur INSERT ... ON CONFLICT DO UPDATE (upsert), alors qu'un INSERT seul ou
-- un UPDATE seul fonctionnaient tous les deux individuellement (vérifié en
-- SQL direct avec `set role anon`).
--
-- Cause : la policy UPDATE avait `USING (true)` mais aucun `WITH CHECK`
-- explicite. Pour un upsert via ON CONFLICT, Postgres évalue WITH CHECK sur
-- la ligne résultante de la branche UPDATE, et sans clause explicite ça ne
-- se comporte pas comme un simple UPDATE direct — le WITH CHECK doit être
-- répété explicitement.

drop policy if exists "sessions: upsert anonyme (Phase 0, voir migration)" on public.sessions;

create policy "sessions: upsert anonyme (Phase 0, voir migration)" on public.sessions
  for update using (true) with check (true);
