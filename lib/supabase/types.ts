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

export type ModuleRow = {
  id: number;
  position: number;
  duration_min: number;
  created_at: string;
};

export type TranslationStatus = "ready" | "pending";

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

// Vue d'agrégation, voir supabase/migrations/0002_dashboard_view.sql.
export type DashboardCoverageRow = {
  locality: string;
  region: string;
  families_reached: number;
  women_reached: number;
  disability_reached: number;
  sessions_count: number;
};

// Vue d'agrégation, voir supabase/migrations/0008_facilitators_view.sql.
export type DashboardFacilitatorRow = {
  facilitator_id: string;
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
        Insert: Omit<ModuleRow, "created_at">;
        Update: Partial<ModuleRow>;
        Relationships: [];
      };
      module_translations: {
        Row: ModuleTranslationRow;
        Insert: Omit<ModuleTranslationRow, "id">;
        Update: Partial<ModuleTranslationRow>;
        Relationships: [];
      };
      sessions: {
        Row: SessionRow;
        Insert: Omit<SessionRow, "synced_at">;
        Update: Partial<SessionRow>;
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
