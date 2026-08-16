-- Vue d'agrégation pour /dashboard/facilitators — même logique que
-- dashboard_coverage (0002_dashboard_view.sql) : agréger côté Postgres
-- plutôt que rapatrier toutes les lignes de `sessions` pour sommer en JS.
create or replace view public.dashboard_facilitators as
select
  facilitator_id,
  region,
  count(*) as sessions_count,
  sum(parents_total) as families_reached,
  max(held_at) as last_session_at
from public.sessions
group by facilitator_id, region;
