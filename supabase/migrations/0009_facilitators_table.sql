-- Table d'identité facilitateur — distincte de `profiles` (comptes admin
-- Supabase Auth). Un facilitateur n'a jamais de auth.uid() (voir
-- 0003_fix_sessions_anon_write.sql), donc ne peut jamais s'insérer dans
-- `profiles`. Cette table capture son identité déclarative (nom, région)
-- telle que saisie au login PIN local (lib/db/meta.ts FacilitatorSession),
-- à des fins de pilotage RH/programme UNICEF — PAS une donnée de
-- bénéficiaire (CLAUDE.md, section confidentialité : cette règle concerne
-- uniquement parents/enfants, jamais le personnel du programme).
--
-- Conçue pour grandir sans douleur : colonnes futures nullable ajoutées par
-- de simples ALTER TABLE ADD COLUMN, jamais un JSONB fourre-tout.
create table if not exists public.facilitators (
  facilitator_id uuid primary key,
  full_name text not null,
  region text not null,
  -- Champs anticipés (RH/emploi) — nuls tant que non collectés. Ajouter une
  -- valeur ici ne casse aucune écriture existante (upsert avec objet partiel).
  photo_url text,
  phone text,
  hired_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.facilitators enable row level security;

-- Écriture anonyme, même compromis assumé que `sessions`
-- (0003/0006/0007_fix_upsert_*.sql) : pas d'auth facilitateur réelle en
-- Phase 0, donc pas de contrôle applicatif possible sans casser le flux —
-- facilitator_id est un UUID généré côté client (crypto.randomUUID()),
-- imprévisible, même niveau d'exposition que sessions aujourd'hui.
create policy "facilitators: upsert anonyme (Phase 0)" on public.facilitators
  for insert with check (true);

create policy "facilitators: update anonyme (Phase 0)" on public.facilitators
  for update using (true) with check (true);

-- Lecture anonyme nécessaire pour que l'upsert (ON CONFLICT) résolve le
-- conflit côté client — même piège que 0007 sur `sessions`, corrigé ici dès
-- le départ plutôt qu'après coup.
create policy "facilitators: lecture anonyme pour upsert (Phase 0)" on public.facilitators
  for select using (true);

create policy "facilitators: admin lit tout" on public.facilitators
  for select using (public.is_admin());
