-- Corrige l'échec d'upload constaté en production :
--   403 "new row violates row-level security policy"
--   sur POST /storage/v1/object/media/modules/1/sign/video.mp4
--
-- Cause : components/dashboard/media-upload-cell.tsx appelle
-- `.upload(path, file, { upsert: true })`. Quand le fichier existe déjà,
-- Supabase Storage effectue un UPDATE sur storage.objects — or la seule
-- politique d'écriture définie jusqu'ici (0001_init.sql, redéfinie en
-- 0005_fix_profiles_rls_recursion.sql) ne couvrait que INSERT.
--
-- Conséquence : le PREMIER dépôt sur une case vide passait, tout
-- REMPLACEMENT échouait. C'est exactement le cas rencontré, le fichier
-- sign/video.mp4 ayant déjà été déposé une première fois.
--
-- DELETE est ajouté dans la même migration : sans lui, un média déposé par
-- erreur ne peut pas être retiré, et la page Contenus n'aurait aucun moyen
-- d'offrir une suppression.
--
-- On passe par public.is_admin() (security definer, créée en 0005) plutôt
-- que par une sous-requête sur public.profiles : c'est ce qui avait causé
-- la récursion RLS corrigée à l'époque.

drop policy if exists "media: mise à jour admin" on storage.objects;
create policy "media: mise à jour admin" on storage.objects
  for update
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "media: suppression admin" on storage.objects;
create policy "media: suppression admin" on storage.objects
  for delete
  using (bucket_id = 'media' and public.is_admin());
