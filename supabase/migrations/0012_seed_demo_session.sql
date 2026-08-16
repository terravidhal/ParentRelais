-- Donnée de démo/test — PAS un fixture de production. Une séance et son
-- facilitateur déterministes, uniquement pour que /dashboard/facilitators
-- ait au moins une ligne à afficher/cliquer (tests Playwright et démo
-- jury), sans dépendre de la stabilité du flux facilitateur complet
-- (offline → séance → sync) pour peupler le dashboard une première fois.
insert into public.facilitators (facilitator_id, full_name, region)
values (
  '00000000-0000-4000-8000-000000000001',
  'Aïcha Demo',
  'Extrême-Nord'
)
on conflict (facilitator_id) do nothing;

insert into public.sessions (
  client_uuid, facilitator_id, module_id, region, locality,
  parents_total, women, disability_count, quiz_score, quiz_max, held_at
)
values (
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  1, 'Extrême-Nord', 'Maroua',
  12, 8, 1, 2, 2, now()
)
on conflict (client_uuid) do nothing;
