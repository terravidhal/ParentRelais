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
create policy "modules: lecture admin (brouillons inclus)" on public.modules
  for select using (public.is_admin());

create policy "module_translations: lecture admin (brouillons inclus)" on public.module_translations
  for select using (public.is_admin());
