-- ============================================================
-- 0017 — Authentification facilitateur + fermeture des politiques ouvertes
-- ============================================================
--
-- CE QUE CETTE MIGRATION CORRIGE (démontré par requêtes réelles) :
--
--   GET  /sessions              en anonyme -> 200 OK  (toutes les séances)
--   GET  /facilitators          en anonyme -> 200 OK  (noms en clair)
--   GET  /dashboard_coverage    en anonyme -> 200 OK  (stats nationales)
--   POST /sessions              en anonyme -> 201 CREATED  (!!)
--
-- La clé `anon` est publique par conception : elle est dans le bundle JS.
-- Ce sont les politiques RLS qui protègent, et cinq d'entre elles étaient
-- ouvertes en `(true)` depuis la Phase 0 (migrations 0003, 0006, 0007, 0009)
-- parce que le facilitateur n'avait aucun compte.
--
-- Il en a un désormais : l'écriture devient nominative et vérifiable.
--
-- ATTENTION À L'ORDRE : cette migration suppose que les facilitateurs
-- disposent déjà d'un compte (créé depuis le tableau de bord). L'appliquer
-- avant couperait la synchronisation de terrain.

-- ------------------------------------------------------------
-- 1. Purge des données de test (E7)
-- ------------------------------------------------------------
-- Constaté : 73 lignes dans `facilitators` dont 70 de test, 65 séances dont
-- 61 générées par les exécutions e2e successives — chaque passage de la
-- suite en crée une nouvelle. Le tableau de bord affichait « Test5 »,
-- « TestSync » et une séance « AUDIT » à 999 familles au milieu des
-- statistiques nationales.
--
-- Ce nettoyage doit PRÉCÉDER la contrainte de clé étrangère ajoutée juste
-- après : ces lignes n'ont aucun compte correspondant dans auth.users, et
-- la contrainte échouerait sur elles.
--
-- Le critère de purge n'est PAS le nom : filtrer sur « test » laissait
-- passer les identités locales réelles (« vidhal ») qui n'ont pas non plus
-- de compte, et la contrainte de clé étrangère échouait dessus — constaté à
-- la première application (erreur 23503).
--
-- Le seul critère juste est structurel : **une ligne sans compte
-- `auth.users` correspondant** ne peut pas survivre à cette migration, quel
-- que soit son nom. Toutes ces lignes viennent de l'ancien système, où le
-- facilitateur générait son identifiant lui-même sans jamais s'authentifier.

-- Les SÉANCES, elles, ne sont pas supprimées mais RATTACHÉES au compte de
-- démonstration : elles portent les statistiques que le jury verra (familles
-- touchées par localité). Les effacer viderait le tableau de bord.
--
-- Seules partent celles dont la localité trahit un test automatisé — elles
-- polluaient la couverture nationale avec « Test5 », « TestSync », « AUDIT ».
delete from public.sessions
where region ilike '%test%'
   or region ilike '%audit%'
   or locality ilike '%test%'
   or locality ilike '%audit%';

update public.sessions s
set facilitator_id = (
  select id from auth.users
  where email = 'facilitateur.demo@parentrelais.app'
)
where not exists (
  select 1 from auth.users u where u.id = s.facilitator_id
);

delete from public.facilitators f
where not exists (
  select 1 from auth.users u where u.id = f.facilitator_id
);

-- ------------------------------------------------------------
-- 2. Lier l'identité facilitateur à un vrai compte
-- ------------------------------------------------------------
-- E5 de l'audit : `sessions.facilitator_id` référençait `profiles`, alors
-- que l'identité de terrain vit dans `facilitators`. Deux tables pour une
-- même personne, sans lien — incohérence corrigée ici : les deux pointent
-- désormais vers `auth.users`, l'autorité unique sur les comptes.

alter table public.facilitators
  drop constraint if exists facilitators_facilitator_id_fkey;

alter table public.facilitators
  add constraint facilitators_facilitator_id_fkey
  foreign key (facilitator_id) references auth.users (id) on delete cascade;

-- `sessions.facilitator_id` référençait `profiles`. Or `profiles` sert au
-- rôle applicatif (admin/facilitateur) : exiger une ligne là pour chaque
-- facilitateur ajoutait une table intermédiaire sans valeur, et c'est
-- précisément l'incohérence E5. On pointe directement vers l'autorité.
--
-- `on delete restrict` et non `cascade` : supprimer un compte ne doit JAMAIS
-- effacer silencieusement les séances qu'il a animées — ce sont les données
-- du programme, pas celles de la personne (règle 4).
alter table public.sessions
  drop constraint if exists sessions_facilitator_id_fkey;

alter table public.sessions
  add constraint sessions_facilitator_id_fkey
  foreign key (facilitator_id) references auth.users (id) on delete restrict;

-- ------------------------------------------------------------
-- 3. Fermer les politiques ouvertes sur `sessions`
-- ------------------------------------------------------------
drop policy if exists "sessions: écriture anonyme (Phase 0, voir migration)" on public.sessions;
drop policy if exists "sessions: upsert anonyme (Phase 0, voir migration)" on public.sessions;
drop policy if exists "sessions: lecture anonyme pour upsert (Phase 0, voir migration)" on public.sessions;
drop policy if exists "sessions: facilitateur écrit les siennes" on public.sessions;
drop policy if exists "sessions: facilitateur lit les siennes" on public.sessions;

-- Un facilitateur n'écrit QUE ses propres séances. C'est ce qui rend
-- l'injection anonyme impossible.
create policy "sessions: le facilitateur écrit les siennes" on public.sessions
  for insert with check (auth.uid() = facilitator_id);

-- L'upsert de la synchro rejoue les mêmes lignes (idempotence par
-- client_uuid) : il lui faut update ET select, sinon la remontée échoue.
create policy "sessions: le facilitateur met à jour les siennes" on public.sessions
  for update using (auth.uid() = facilitator_id)
  with check (auth.uid() = facilitator_id);

create policy "sessions: le facilitateur lit les siennes" on public.sessions
  for select using (auth.uid() = facilitator_id or public.is_admin());

-- Sans politique DELETE, aucun nettoyage n'était possible : le DELETE
-- anonyme renvoyait 200 sans rien supprimer (constaté pendant l'audit).
create policy "sessions: suppression admin" on public.sessions
  for delete using (public.is_admin());

-- ------------------------------------------------------------
-- 4. Fermer les politiques ouvertes sur `facilitators`
-- ------------------------------------------------------------
drop policy if exists "facilitators: upsert anonyme (Phase 0)" on public.facilitators;
drop policy if exists "facilitators: update anonyme (Phase 0)" on public.facilitators;
drop policy if exists "facilitators: lecture anonyme pour upsert (Phase 0)" on public.facilitators;

create policy "facilitators: chacun crée la sienne" on public.facilitators
  for insert with check (auth.uid() = facilitator_id);

create policy "facilitators: chacun met à jour la sienne" on public.facilitators
  for update using (auth.uid() = facilitator_id)
  with check (auth.uid() = facilitator_id);

create policy "facilitators: chacun lit la sienne" on public.facilitators
  for select using (auth.uid() = facilitator_id or public.is_admin());

create policy "facilitators: création et gestion admin" on public.facilitators
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- 5. Les vues ne doivent plus contourner la RLS
-- ------------------------------------------------------------
-- Sans `security_invoker`, une vue s'exécute avec les droits de son
-- créateur et court-circuite les politiques des tables sous-jacentes :
-- fermer `sessions` ci-dessus n'aurait servi à rien, les statistiques
-- seraient restées lisibles publiquement par la vue.

alter view public.dashboard_coverage set (security_invoker = true);
alter view public.dashboard_facilitators set (security_invoker = true);
