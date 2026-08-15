-- ParentRelais — schéma initial (docs/03-DATA-MODEL.md)
-- Rappel confidentialité : aucune donnée identifiante sur parents/enfants,
-- uniquement des compteurs agrégés par séance.

-- ============================================================
-- profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('facilitator', 'admin')),
  region text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: chacun lit le sien" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles: admin lit tout" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "profiles: chacun écrit le sien" on public.profiles
  for update using (auth.uid() = id);

-- ============================================================
-- modules
-- ============================================================
create table if not exists public.modules (
  id integer primary key,
  position integer not null,
  duration_min integer not null,
  created_at timestamptz not null default now()
);

alter table public.modules enable row level security;

create policy "modules: lecture authentifiés" on public.modules
  for select using (auth.role() = 'authenticated');

create policy "modules: écriture admin" on public.modules
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ============================================================
-- module_translations
-- ============================================================
create table if not exists public.module_translations (
  id uuid primary key default gen_random_uuid(),
  module_id integer not null references public.modules (id) on delete cascade,
  lang text not null,
  title text not null,
  summary text not null,
  key_points text[] not null default '{}',
  audio_url text,
  video_url text,
  subtitles_url text,
  status text not null check (status in ('ready', 'pending')) default 'pending',
  unique (module_id, lang)
);

alter table public.module_translations enable row level security;

create policy "module_translations: lecture authentifiés" on public.module_translations
  for select using (auth.role() = 'authenticated');

create policy "module_translations: écriture admin" on public.module_translations
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ============================================================
-- sessions
-- client_uuid est PRIMARY KEY (pas juste unique) : c'est la condition pour
-- que l'upsert idempotent du sync engine fonctionne nativement côté Postgres
-- (voir lib/sync/engine.ts, onConflict: "client_uuid").
-- ============================================================
create table if not exists public.sessions (
  client_uuid uuid primary key,
  facilitator_id uuid not null references public.profiles (id),
  module_id integer not null references public.modules (id),
  region text not null,
  locality text not null,
  parents_total integer not null check (parents_total >= 0),
  women integer not null check (women >= 0),
  disability_count integer not null check (disability_count >= 0),
  quiz_score integer not null check (quiz_score >= 0),
  quiz_max integer not null check (quiz_max >= 0),
  held_at timestamptz not null,
  synced_at timestamptz not null default now()
);

alter table public.sessions enable row level security;

create policy "sessions: facilitateur lit les siennes" on public.sessions
  for select using (auth.uid() = facilitator_id);

create policy "sessions: admin lit tout" on public.sessions
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "sessions: facilitateur écrit les siennes" on public.sessions
  for insert with check (auth.uid() = facilitator_id);

create policy "sessions: facilitateur met à jour les siennes" on public.sessions
  for update using (auth.uid() = facilitator_id);

-- ============================================================
-- Storage bucket média (audios/vidéos/sous-titres)
-- Nommage : modules/{module_id}/{lang}/audio.mp3
-- ============================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media: lecture publique" on storage.objects
  for select using (bucket_id = 'media');

create policy "media: écriture admin" on storage.objects
  for insert with check (
    bucket_id = 'media'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
