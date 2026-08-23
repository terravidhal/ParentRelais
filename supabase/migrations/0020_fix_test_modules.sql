-- Récupère les identifiants 3 et 4, occupés par des modules de test.
--
-- Ces deux lignes viennent de mes vérifications de la veille (« Module de
-- vérification automatique »), archivées après usage. La migration 0018
-- voulait y placer « Communiquer avec son enfant » et « Discipline
-- positive », mais son `on conflict (id) do nothing` a silencieusement
-- ignoré l'insertion : les identifiants étaient déjà pris.
--
-- Résultat constaté : 6 modules visibles au lieu de 8, et 12 questions de
-- quiz au lieu de 16.
--
-- On réécrit ces deux lignes au lieu de les supprimer : aucune séance ne les
-- référence (elles n'ont jamais été animées), mais réutiliser l'identifiant
-- évite un trou dans la numérotation affichée au facilitateur (« Module 3 »).

update public.modules
set position = 3, duration_min = 40, status = 'published', archived_at = null
where id = 3;

update public.modules
set position = 4, duration_min = 45, status = 'published', archived_at = null
where id = 4;

-- Les traductions existent déjà (créées vides à la création du module) :
-- c'est un UPDATE, pas un INSERT.
update public.module_translations
set title = 'Communiquer avec son enfant',
    summary = 'Écouter, nommer les émotions et parler à hauteur d''enfant. Des gestes simples qui transforment le quotidien à la maison.',
    key_points = array['Se mettre à sa hauteur', 'Nommer ce qu''il ressent', 'Écouter sans interrompre'],
    status = 'ready'
where module_id = 3 and lang = 'fr';

update public.module_translations
set title = 'Talking with your child',
    summary = 'Listening, naming emotions and speaking at the child''s level. Simple habits that change daily life at home.',
    key_points = array['Get down to their level', 'Name what they feel', 'Listen without interrupting'],
    status = 'ready'
where module_id = 3 and lang = 'en';

update public.module_translations
set title = 'Discipline positive',
    summary = 'Poser des limites clairement, sans frapper ni humilier. Comprendre ce que l''enfant apprend vraiment de la punition.',
    key_points = array['Des règles peu nombreuses et claires', 'Expliquer la conséquence', 'Réparer plutôt que punir'],
    status = 'ready'
where module_id = 4 and lang = 'fr';

update public.module_translations
set title = 'Positive discipline',
    summary = 'Setting clear limits without hitting or shaming. Understanding what a child actually learns from punishment.',
    key_points = array['Few, clear rules', 'Explain the consequence', 'Repair rather than punish'],
    status = 'ready'
where module_id = 4 and lang = 'en';

-- Filet : si une traduction manquait (module créé avant la génération
-- automatique des cases), on la crée.
insert into public.module_translations (module_id, lang, title, summary, key_points, status)
select m.id, lang, '', '', '{}', 'pending'
from public.modules m
cross join (values ('fr'), ('en'), ('ff'), ('sign')) as langs(lang)
where m.id in (3, 4)
on conflict (module_id, lang) do nothing;

-- ------------------------------------------------------------
-- Le quiz de ces deux modules (0019 les avait sautés aussi)
-- ------------------------------------------------------------
do $$
declare
  v_qid integer;
begin
  if not exists (select 1 from public.quiz_questions where module_id = 3) then
    insert into public.quiz_questions (module_id, position, correct_index)
    values (3, 1, 1) returning id into v_qid;
    insert into public.quiz_question_translations (question_id, lang, question, options) values
      (v_qid, 'fr', 'Un enfant en colère a d''abord besoin…',
       array['Qu''on le punisse', 'Qu''on nomme ce qu''il ressent', 'Qu''on le laisse seul']),
      (v_qid, 'en', 'An angry child first needs…',
       array['To be punished', 'Someone to name what he feels', 'To be left alone']);

    insert into public.quiz_questions (module_id, position, correct_index)
    values (3, 2, 0) returning id into v_qid;
    insert into public.quiz_question_translations (question_id, lang, question, options) values
      (v_qid, 'fr', 'Se mettre à la hauteur de l''enfant pour lui parler…',
       array['L''aide à se sentir écouté', 'Lui donne trop d''importance', 'N''a aucun effet']),
      (v_qid, 'en', 'Getting down to a child''s level to speak…',
       array['Helps him feel heard', 'Gives him too much importance', 'Has no effect']);
  end if;

  if not exists (select 1 from public.quiz_questions where module_id = 4) then
    insert into public.quiz_questions (module_id, position, correct_index)
    values (4, 1, 2) returning id into v_qid;
    insert into public.quiz_question_translations (question_id, lang, question, options) values
      (v_qid, 'fr', 'Que retient surtout un enfant qu''on frappe ?',
       array['La règle qu''il a enfreinte', 'Le respect de ses parents', 'La peur, pas la leçon']),
      (v_qid, 'en', 'What does a child who is hit mainly learn?',
       array['The rule he broke', 'Respect for his parents', 'Fear, not the lesson']);

    insert into public.quiz_questions (module_id, position, correct_index)
    values (4, 2, 1) returning id into v_qid;
    insert into public.quiz_question_translations (question_id, lang, question, options) values
      (v_qid, 'fr', 'Des règles efficaces à la maison sont…',
       array['Nombreuses et strictes', 'Peu nombreuses et claires', 'Différentes chaque jour']),
      (v_qid, 'en', 'Effective rules at home are…',
       array['Many and strict', 'Few and clear', 'Different every day']);
  end if;
end $$;
