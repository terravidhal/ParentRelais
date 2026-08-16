-- Ajoute le nom au vu d'agrégation (0008_facilitators_view.sql), maintenant
-- que `facilitators` existe (0009_facilitators_table.sql). LEFT JOIN : une
-- séance peut techniquement précéder l'upsert facilitateur correspondant si
-- celui-ci échoue silencieusement (voir lib/sync/engine.ts,
-- syncFacilitatorIdentity) — le nom doit pouvoir être NULL sans exclure la
-- ligne.
--
-- DROP puis CREATE (pas CREATE OR REPLACE) : Postgres refuse de réordonner
-- ou insérer des colonnes au milieu d'une vue existante via REPLACE
-- (erreur 42P16, "cannot change name of view column"). Sans dépendants
-- (aucune autre vue/fonction ne référence dashboard_facilitators), le DROP
-- est sûr.
drop view if exists public.dashboard_facilitators;

create view public.dashboard_facilitators as
select
  s.facilitator_id,
  f.full_name,
  s.region,
  count(*) as sessions_count,
  sum(s.parents_total) as families_reached,
  max(s.held_at) as last_session_at
from public.sessions s
left join public.facilitators f on f.facilitator_id = s.facilitator_id
group by s.facilitator_id, f.full_name, s.region;
