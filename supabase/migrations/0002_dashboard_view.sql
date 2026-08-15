-- Vue d'agrégation pour /dashboard — évite de rapatrier toutes les lignes de
-- `sessions` côté client pour sommer en JS.
create or replace view public.dashboard_coverage as
select
  locality,
  region,
  sum(parents_total) as families_reached,
  sum(women) as women_reached,
  sum(disability_count) as disability_reached,
  count(*) as sessions_count
from public.sessions
group by locality, region;
