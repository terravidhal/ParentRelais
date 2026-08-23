/**
 * Types reflétant docs/03-DATA-MODEL.md, écrits à la main tant que le projet
 * Supabase n'existe pas. TODO Phase 1 : remplacer par
 * `supabase gen types typescript` une fois le projet créé.
 *
 * Note : les shapes de lignes sont des `type` (pas des `interface`) —
 * `@supabase/supabase-js` résout ses génériques via des mapped/conditional
 * types qui ne se distribuent pas correctement sur des `interface`.
 */

export type UserRole = "facilitator" | "admin";

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  region: string;
  created_at: string;
};

/** Un module en brouillon reste invisible du terrain (migration 0014). */
export type ModuleStatus = "draft" | "published";

export type ModuleRow = {
  id: number;
  position: number;
  duration_min: number;
  status: ModuleStatus;
  /** Retrait par archivage, jamais suppression : les séances référencent module_id. */
  archived_at: string | null;
  created_at: string;
};

export type TranslationStatus = "ready" | "pending";

/** Référentiel : langues, régions, localités (migration 0021). */
export type LanguageRow = {
  code: string;
  label: string;
  short_label: string;
  position: number;
  active: boolean;
  created_at: string;
};

export type RegionRow = {
  id: number;
  name: string;
  position: number;
  active: boolean;
  created_at: string;
};

export type LocalityRow = {
  id: number;
  region_id: number;
  name: string;
  position: number;
  active: boolean;
  created_at: string;
};

export type QuizQuestionRow = {
  id: number;
  module_id: number;
  position: number;
  /** Index de la bonne réponse dans `options` — identique quelle que soit la langue. */
  correct_index: number;
  created_at: string;
};

export type QuizQuestionTranslationRow = {
  id: string;
  question_id: number;
  lang: string;
  question: string;
  options: string[];
};

export type ModuleTranslationRow = {
  id: string;
  module_id: number;
  lang: string;
  title: string;
  summary: string;
  key_points: string[];
  audio_url: string | null;
  video_url: string | null;
  subtitles_url: string | null;
  status: TranslationStatus;
};

export type SessionRow = {
  client_uuid: string;
  facilitator_id: string;
  module_id: number;
  region: string;
  locality: string;
  parents_total: number;
  women: number;
  disability_count: number;
  quiz_score: number;
  quiz_max: number;
  held_at: string;
  synced_at: string | null;
};

// Identité facilitateur — voir supabase/migrations/0009_facilitators_table.sql.
// Distincte de `profiles` (comptes admin) : un facilitateur n'a jamais de
// auth.uid(), cette table est peuplée par upsert anonyme depuis le moteur
// de synchro (lib/sync/engine.ts).
export type FacilitatorRow = {
  facilitator_id: string;
  full_name: string;
  region: string;
  photo_url: string | null;
  phone: string | null;
  hired_at: string | null;
  created_at: string;
  updated_at: string;
};

// Vue d'agrégation, voir supabase/migrations/0002_dashboard_view.sql.
export type DashboardCoverageRow = {
  locality: string;
  region: string;
  families_reached: number;
  women_reached: number;
  disability_reached: number;
  sessions_count: number;
};

// Vue d'agrégation, voir supabase/migrations/0008_facilitators_view.sql et
// 0010_facilitators_view_name.sql (ajout de full_name).
export type DashboardFacilitatorRow = {
  facilitator_id: string;
  full_name: string | null;
  region: string;
  sessions_count: number;
  families_reached: number;
  last_session_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Profile;
        Update: Partial<Profile>;
        Relationships: [];
      };
      modules: {
        Row: ModuleRow;
        // `id` est auto-généré depuis la migration 0015 (identity) : une
        // création depuis le tableau de bord ne le fournit pas.
        Insert: Omit<ModuleRow, "id" | "created_at" | "status" | "archived_at"> &
          Partial<Pick<ModuleRow, "id" | "status" | "archived_at">>;
        Update: Partial<ModuleRow>;
        Relationships: [];
      };
      module_translations: {
        Row: ModuleTranslationRow;
        // Les URL de médias sont nullables et remplies plus tard, par
        // l'upload depuis la matrice — jamais à la création.
        Insert: Omit<
          ModuleTranslationRow,
          "id" | "audio_url" | "video_url" | "subtitles_url"
        > &
          Partial<
            Pick<ModuleTranslationRow, "audio_url" | "video_url" | "subtitles_url">
          >;
        Update: Partial<ModuleTranslationRow>;
        Relationships: [];
      };
      languages: {
        Row: LanguageRow;
        Insert: Omit<LanguageRow, "created_at" | "position" | "active"> &
          Partial<Pick<LanguageRow, "position" | "active">>;
        Update: Partial<LanguageRow>;
        Relationships: [];
      };
      regions: {
        Row: RegionRow;
        Insert: Omit<RegionRow, "id" | "created_at" | "position" | "active"> &
          Partial<Pick<RegionRow, "id" | "position" | "active">>;
        Update: Partial<RegionRow>;
        Relationships: [];
      };
      localities: {
        Row: LocalityRow;
        Insert: Omit<LocalityRow, "id" | "created_at" | "position" | "active"> &
          Partial<Pick<LocalityRow, "id" | "position" | "active">>;
        Update: Partial<LocalityRow>;
        Relationships: [];
      };
      quiz_questions: {
        Row: QuizQuestionRow;
        Insert: Omit<QuizQuestionRow, "id" | "created_at"> &
          Partial<Pick<QuizQuestionRow, "id">>;
        Update: Partial<QuizQuestionRow>;
        Relationships: [];
      };
      quiz_question_translations: {
        Row: QuizQuestionTranslationRow;
        Insert: Omit<QuizQuestionTranslationRow, "id">;
        Update: Partial<QuizQuestionTranslationRow>;
        Relationships: [];
      };
      sessions: {
        Row: SessionRow;
        Insert: Omit<SessionRow, "synced_at">;
        Update: Partial<SessionRow>;
        Relationships: [];
      };
      facilitators: {
        Row: FacilitatorRow;
        Insert: Omit<
          FacilitatorRow,
          "photo_url" | "phone" | "hired_at" | "created_at"
        > & {
          photo_url?: string | null;
          phone?: string | null;
          hired_at?: string | null;
        };
        Update: Partial<FacilitatorRow>;
        Relationships: [];
      };
    };
    Views: {
      dashboard_coverage: {
        Row: DashboardCoverageRow;
        Relationships: [];
      };
      dashboard_facilitators: {
        Row: DashboardFacilitatorRow;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
  };
};
