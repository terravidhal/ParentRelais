-- Correctif : le facilitateur s'authentifie via un PIN 100% local (Phase 0,
-- voir app/(facilitator)/login/page.tsx), jamais via Supabase Auth. La RLS
-- initiale de 0001_init.sql exigeait auth.uid() = facilitator_id, ce qui
-- bloquait silencieusement TOUTE écriture (aucun facilitateur n'est jamais
-- authentifié côté Supabase). De même, facilitator_id est un UUID généré
-- côté client au premier login, qui ne correspond à aucune ligne dans
-- `profiles` — la contrainte FK stricte bloquait aussi l'upsert.
--
-- Correctif Phase 0 assumé : écriture anonyme autorisée dans `sessions` via
-- la clé publishable seule. Compromis de sécurité documenté : n'importe qui
-- disposant de la clé publique (publique par design) peut insérer des
-- lignes. Acceptable ici car aucune donnée identifiante n'est stockée
-- (CLAUDE.md), seulement des compteurs agrégés. Durcissement prévu en
-- Phase 1 avec un vrai flux d'auth par facilitateur.

alter table public.sessions drop constraint if exists sessions_facilitator_id_fkey;

drop policy if exists "sessions: facilitateur écrit les siennes" on public.sessions;
drop policy if exists "sessions: facilitateur met à jour les siennes" on public.sessions;

create policy "sessions: écriture anonyme (Phase 0, voir migration)" on public.sessions
  for insert with check (true);

create policy "sessions: upsert anonyme (Phase 0, voir migration)" on public.sessions
  for update using (true);

-- La lecture reste restreinte : un facilitateur non authentifié via Supabase
-- Auth ne peut de toute façon pas lire ses propres séances (auth.uid() est
-- toujours null pour lui) — c'est le dashboard admin qui lit tout, sans
-- changement nécessaire ici.
