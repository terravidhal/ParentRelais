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
