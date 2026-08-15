-- Correctif : "infinite recursion detected in policy for relation profiles"
-- (SQL state 42P17). Les policies "X: admin lit tout" (sur profiles, modules,
-- module_translations, sessions) vérifient le rôle admin en relisant
-- `profiles`, ce qui redéclenche la policy RLS de `profiles` elle-même,
-- créant une boucle infinie — et cassait TOUTE requête touchant ces tables,
-- y compris la synchronisation de séances qui ne dépend même pas du rôle admin.
--
-- Fix standard : une fonction `security definer` qui lit `profiles` en
-- bypassant RLS (elle s'exécute avec les droits du propriétaire de la
-- fonction, pas de l'appelant), cassant la récursion.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles
drop policy if exists "profiles: admin lit tout" on public.profiles;
create policy "profiles: admin lit tout" on public.profiles
  for select using (public.is_admin());

-- modules
drop policy if exists "modules: écriture admin" on public.modules;
create policy "modules: écriture admin" on public.modules
  for all using (public.is_admin());

-- module_translations
drop policy if exists "module_translations: écriture admin" on public.module_translations;
create policy "module_translations: écriture admin" on public.module_translations
  for all using (public.is_admin());

-- sessions
drop policy if exists "sessions: admin lit tout" on public.sessions;
create policy "sessions: admin lit tout" on public.sessions
  for select using (public.is_admin());

-- storage.objects (media bucket)
drop policy if exists "media: écriture admin" on storage.objects;
create policy "media: écriture admin" on storage.objects
  for insert with check (
    bucket_id = 'media' and public.is_admin()
  );
