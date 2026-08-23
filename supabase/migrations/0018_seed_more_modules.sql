-- Six modules supplémentaires (8 au total).
--
-- Deux modules ne suffisaient pas : la pagination de l'accueil facilitateur
-- (PAGE_SIZE = 6) ne se déclenchait jamais, et le tableau de bord ne
-- permettait pas de juger la lisibilité du contenu à l'échelle.
--
-- Les thèmes suivent le programme de parentalité positive UNICEF/MINPROFF
-- (voir docs/04-SCREENS.md). Ce sont des contenus de démonstration : les
-- textes réels seront fournis par l'UNICEF, et les remplacer ne demandera
-- aucune modification de code — c'est précisément la promesse du système.
--
-- Pas d'audio ni de vidéo sur ces modules : les fichiers n'existent pas
-- encore dans /public. Leurs cases restent « en attente de contenu », ce qui
-- illustre aussi la matrice module × langue côté pilotage.

insert into public.modules (id, position, duration_min, status)
values
  (3, 3, 40, 'published'),
  (4, 4, 45, 'published'),
  (5, 5, 35, 'published'),
  (6, 6, 50, 'published'),
  (7, 7, 40, 'published'),
  (8, 8, 45, 'published')
on conflict (id) do nothing;

insert into public.module_translations
  (module_id, lang, title, summary, key_points, status)
values
  (
    3, 'fr',
    'Communiquer avec son enfant',
    'Écouter, nommer les émotions et parler à hauteur d''enfant. Des gestes simples qui transforment le quotidien à la maison.',
    array['Se mettre à sa hauteur', 'Nommer ce qu''il ressent', 'Écouter sans interrompre'],
    'ready'
  ),
  (
    3, 'en',
    'Talking with your child',
    'Listening, naming emotions and speaking at the child''s level. Simple habits that change daily life at home.',
    array['Get down to their level', 'Name what they feel', 'Listen without interrupting'],
    'ready'
  ),
  (
    4, 'fr',
    'Discipline positive',
    'Poser des limites clairement, sans frapper ni humilier. Comprendre ce que l''enfant apprend vraiment de la punition.',
    array['Des règles peu nombreuses et claires', 'Expliquer la conséquence', 'Réparer plutôt que punir'],
    'ready'
  ),
  (
    4, 'en',
    'Positive discipline',
    'Setting clear limits without hitting or shaming. Understanding what a child actually learns from punishment.',
    array['Few, clear rules', 'Explain the consequence', 'Repair rather than punish'],
    'ready'
  ),
  (
    5, 'fr',
    'Le jeu, c''est sérieux',
    'Jouer avec son enfant nourrit son cerveau autant que la nourriture nourrit son corps. Avec ce qu''on a sous la main.',
    array['Jouer avec ce qu''on a', 'Laisser l''enfant mener', '15 minutes par jour suffisent'],
    'ready'
  ),
  (
    5, 'en',
    'Play is serious',
    'Playing with your child feeds the brain as much as food feeds the body — using whatever is at hand.',
    array['Play with what you have', 'Let the child lead', 'Fifteen minutes a day is enough'],
    'ready'
  ),
  (
    6, 'fr',
    'Nutrition des 1000 jours',
    'De la grossesse aux deux ans de l''enfant : la fenêtre décisive pour sa croissance et son développement.',
    array['Allaitement exclusif jusqu''à 6 mois', 'Diversifier progressivement', 'Reconnaître les signes d''alerte'],
    'ready'
  ),
  (
    6, 'en',
    'Nutrition in the first 1000 days',
    'From pregnancy to age two: the decisive window for a child''s growth and development.',
    array['Exclusive breastfeeding to 6 months', 'Introduce foods gradually', 'Recognise warning signs'],
    'ready'
  ),
  (
    7, 'fr',
    'Le rôle du père',
    'Un père présent change la trajectoire de l''enfant. Dépasser l''idée que s''occuper des enfants ne serait pas son affaire.',
    array['La présence compte plus que l''argent', 'Porter, nourrir, consoler', 'Soutenir la mère au quotidien'],
    'ready'
  ),
  (
    7, 'en',
    'The father''s role',
    'A present father changes a child''s path. Moving past the idea that childcare is not his business.',
    array['Presence matters more than money', 'Hold, feed, comfort', 'Support the mother daily'],
    'ready'
  ),
  (
    8, 'fr',
    'Protéger l''enfant des violences',
    'Reconnaître les situations à risque, savoir vers qui se tourner et ce que dit la loi camerounaise.',
    array['Reconnaître les signes', 'À qui signaler', 'L''enfant n''est jamais responsable'],
    'ready'
  ),
  (
    8, 'en',
    'Protecting children from violence',
    'Recognising risk situations, knowing who to turn to, and what Cameroonian law says.',
    array['Recognise the signs', 'Who to report to', 'The child is never at fault'],
    'ready'
  )
on conflict (module_id, lang) do nothing;

-- Cases vides pour les langues non encore traduites : c'est ce qui rend la
-- matrice du tableau de bord utilisable (l'upload fait un UPDATE, il lui
-- faut une ligne existante — voir migration 0011).
insert into public.module_translations (module_id, lang, title, summary, key_points, status)
select m.id, lang, '', '', '{}', 'pending'
from public.modules m
cross join (values ('ff'), ('sign')) as langs(lang)
on conflict (module_id, lang) do nothing;

-- Recaler la séquence : ces modules ont des id explicites, sans quoi la
-- prochaine création depuis le tableau de bord entrerait en collision.
select setval(
  pg_get_serial_sequence('public.modules', 'id'),
  greatest((select coalesce(max(id), 0) from public.modules), 1)
);
