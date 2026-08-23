-- ============================================================
-- 0015 — À EXÉCUTER : contenu + publication, en une seule passe
-- ============================================================
-- Constaté sur la base en ligne : `modules` et `module_translations` sont
-- VIDES (les seeds 0004/0011 n'ont jamais été appliqués), et les colonnes de
-- publication n'existent pas.
--
-- Tant que le contenu vivait dans le bundle, ça ne se voyait pas. Depuis que
-- Supabase est la source de vérité, une base vide = une app vide.
--
-- Ce fichier rejoue 0004 + 0011 + 0014 dans le bon ordre. Tout est
-- idempotent (`if not exists`, `on conflict do nothing`) : le rejouer ne
-- duplique rien, et les seeds ne s'appliquent que sur des tables vides —
-- ils ne réécrivent jamais du contenu existant.



-- ---------- 1. Colonnes + politiques (ex-0014) ----------

-- Le contenu des facilitateurs venait jusqu'ici d'un fichier en dur dans le
-- code (lib/content/seed.ts), copié dans Dexie au premier lancement. Un
-- module créé dans l'espace de pilotage n'atteignait donc JAMAIS un
-- téléphone — en contradiction directe avec la promesse affichée sur la
-- landing : « ajouter une langue = remplir une case, sans refonte ».
--
-- Supabase devient l'unique source de vérité. Cette migration ajoute ce qui
-- manquait pour qu'un module puisse être créé, publié et retiré sans toucher
-- au code.

-- Statut de publication : un module incomplet (sans audio, sans traduction)
-- ne doit pas descendre sur le terrain par accident.
alter table public.modules
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'published'));

-- Retrait par ARCHIVAGE, jamais par suppression : les séances déjà animées
-- référencent module_id. Supprimer la ligne rendrait l'historique illisible,
-- côté dashboard comme côté facilitateur.
alter table public.modules
  add column if not exists archived_at timestamptz;

-- Les modules existants sont déjà en production : ils restent visibles.
update public.modules set status = 'published' where status = 'draft';

-- Écriture réservée aux admins, via public.is_admin() (security definer,
-- créée en 0005) et non une sous-requête sur profiles, qui avait causé la
-- récursion RLS corrigée à l'époque.
drop policy if exists "modules: écriture admin" on public.modules;
create policy "modules: écriture admin" on public.modules
  for insert with check (public.is_admin());

drop policy if exists "modules: mise à jour admin" on public.modules;
create policy "modules: mise à jour admin" on public.modules
  for update using (public.is_admin()) with check (public.is_admin());

-- Même chose sur les traductions : créer un module implique de créer ses
-- lignes de traduction vides (une par langue).
drop policy if exists "module_translations: écriture admin" on public.module_translations;
create policy "module_translations: écriture admin" on public.module_translations
  for insert with check (public.is_admin());

-- ============================================================
-- Lecture anonyme du contenu publié
-- ============================================================
-- Jusqu'ici la lecture exigeait `auth.role() = 'authenticated'`. Or l'app
-- facilitateur est ANONYME par conception (identité locale + code PIN, pas
-- de compte Supabase Auth — même raison qui a imposé l'écriture anonyme des
-- séances en 0003). La contradiction restait invisible tant que le contenu
-- voyageait dans le bundle : personne ne lisait ces tables depuis le
-- terrain. Maintenant que Supabase est la source de vérité, sans cette
-- politique le facilitateur reçoit un catalogue vide — RLS filtre tout, sans
-- erreur, ce qui est le pire des échecs : silencieux.
--
-- Portée volontairement étroite : SEUL le contenu publié et non archivé est
-- exposé. Les brouillons restent invisibles, et aucune donnée personnelle
-- n'est concernée — ces tables ne contiennent que du contenu pédagogique
-- destiné à être diffusé (CLAUDE.md : aucune donnée identifiante collectée).

drop policy if exists "modules: lecture authentifiés" on public.modules;
create policy "modules: lecture du contenu publié" on public.modules
  for select using (status = 'published' and archived_at is null);

drop policy if exists "module_translations: lecture authentifiés" on public.module_translations;
create policy "module_translations: lecture du contenu publié" on public.module_translations
  for select using (
    exists (
      select 1 from public.modules m
      where m.id = module_translations.module_id
        and m.status = 'published'
        and m.archived_at is null
    )
  );

-- Les politiques ci-dessus n'exposent QUE le publié. Sans le complément
-- ci-dessous, un admin qui vient de créer un module en brouillon ne le
-- verrait pas dans son propre tableau de bord — RLS le filtrerait comme
-- pour un facilitateur. Les politiques SELECT s'additionnent (OR) : admin
-- voit tout, terrain ne voit que le publié.
drop policy if exists "modules: lecture admin (brouillons inclus)" on public.modules;
create policy "modules: lecture admin (brouillons inclus)" on public.modules
  for select using (public.is_admin());

drop policy if exists "module_translations: lecture admin (brouillons inclus)" on public.module_translations;
create policy "module_translations: lecture admin (brouillons inclus)" on public.module_translations
  for select using (public.is_admin());


-- ---------- 2. Contenu de démonstration (ex-0004) ----------

-- Correctif : la table `modules` était vide côté Supabase, alors que
-- `sessions.module_id` a une contrainte FK vers `modules(id)`. Chaque tentative
-- de synchronisation d'une séance échouait avec une erreur 500 (violation de
-- contrainte), car les modules de démo n'avaient jamais été insérés côté
-- serveur — seulement dans Dexie via lib/db/seedDb.ts (ensureSeeded).
--
-- Ce seed reproduit exactement lib/content/seed.ts (SEED_MODULES) pour que
-- les deux mondes (local Dexie / serveur Supabase) restent cohérents.

insert into public.modules (id, position, duration_min)
values
  (1, 1, 45),
  (2, 2, 50)
on conflict (id) do nothing;

insert into public.module_translations
  (module_id, lang, title, summary, key_points, audio_url, status)
values
  (
    1, 'fr',
    'La perception de l''enfance',
    'Comprendre l''enfant comme une personne à part entière, avec des besoins et des droits. Déconstruire l''idée que l''enfant se corrige par la punition.',
    array['Chaque enfant a des droits', 'La violence éducative laisse des traces', 'Écouter avant de corriger'],
    '/audio/module-1-fr.mp3',
    'ready'
  ),
  (
    1, 'en',
    'How we see childhood',
    'Understand the child as a full person with needs and rights. Move away from the idea that a child is corrected through punishment.',
    array['Every child has rights', 'Harsh discipline leaves marks', 'Listen before correcting'],
    '/audio/module-1-en.mp3',
    'ready'
  ),
  (
    2, 'fr',
    'Développement de l''enfant',
    'Les grandes étapes du développement de 0 à 6 ans et les pratiques parentales qui les soutiennent au quotidien.',
    array['Les 1000 premiers jours comptent', 'Jouer, c''est apprendre', 'Parler à l''enfant nourrit son cerveau'],
    '/audio/module-2-fr.mp3',
    'ready'
  ),
  (
    2, 'en',
    'Child development',
    'Key development stages from 0 to 6 years and the everyday parenting practices that support them.',
    array['The first 1000 days matter', 'Play is learning', 'Talking to a child feeds the brain'],
    '/audio/module-2-en.mp3',
    'ready'
  )
on conflict (module_id, lang) do nothing;


-- ---------- 3. Cases vides ff/sign (ex-0011) ----------

-- MediaUploadCell fait un UPDATE (pas un upsert) sur module_translations —
-- sans ligne existante pour (module_id, lang), l'upload vers Storage réussit
-- mais le flip de statut "pending"→"ready" échoue silencieusement (0 lignes
-- affectées, pas une erreur PostgREST). "ff" et "sign" n'ont jamais eu de
-- ligne seedée côté Supabase (contrairement à fr/en via 0004) — ce seed
-- crée les cases vides "pending" nécessaires pour que l'upload fonctionne
-- réellement, pas seulement visuellement dans ContentMatrix.
insert into public.module_translations (module_id, lang, title, summary, key_points, status)
select m.id, lang, '', '', '{}', 'pending'
from public.modules m
cross join (values ('ff'), ('sign')) as langs(lang)
on conflict (module_id, lang) do nothing;


-- ---------- 4. Le contenu seedé doit être visible du terrain ----------
-- Les modules insérés ci-dessus prennent `status = 'draft'` par défaut.
-- Sans ceci, ils resteraient invisibles des facilitateurs.
update public.modules set status = 'published' where archived_at is null;

-- ---------- 5. Rendre `modules.id` auto-généré ----------
-- `modules.id` est un `integer` NU, sans séquence : les lignes n'ont jamais
-- été créées qu'à la main, avec des id explicites. Une création depuis le
-- tableau de bord n'aurait donc aucun moyen d'obtenir un identifiant —
-- l'insert échouerait sur une violation NOT NULL.
--
-- On lui attache une identité, puis on recale le compteur au-delà des id
-- déjà utilisés, sinon la première création entrerait en collision avec le
-- module 1.
-- Garde d'idempotence : `add generated` échoue si l'identité existe déjà.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'modules'
      and column_name = 'id' and is_identity = 'YES'
  ) then
    alter table public.modules
      alter column id add generated by default as identity;
  end if;
end $$;

select setval(
  pg_get_serial_sequence('public.modules', 'id'),
  greatest((select coalesce(max(id), 0) from public.modules), 1)
);
