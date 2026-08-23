-- Contraintes d'intégrité manquantes sur `sessions` (E4 de l'audit).
--
-- L'interface limite déjà « dont femmes » et « dont en situation de
-- handicap » au nombre total de parents, mais la base ne l'imposait pas :
-- une écriture directe pouvait enregistrer 5 parents dont 900 femmes, et
-- fausser durablement les statistiques du programme.
--
-- Les données actuelles ont été vérifiées : aucune ligne ne viole ces
-- contraintes, l'ajout ne peut donc pas échouer sur l'existant.

alter table public.sessions
  drop constraint if exists sessions_women_within_total;
alter table public.sessions
  add constraint sessions_women_within_total
  check (women <= parents_total);

alter table public.sessions
  drop constraint if exists sessions_disability_within_total;
alter table public.sessions
  add constraint sessions_disability_within_total
  check (disability_count <= parents_total);

-- Un score supérieur au nombre de questions serait tout aussi absurde.
alter table public.sessions
  drop constraint if exists sessions_score_within_max;
alter table public.sessions
  add constraint sessions_score_within_max
  check (quiz_score <= quiz_max);
