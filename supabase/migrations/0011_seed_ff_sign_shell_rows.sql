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
