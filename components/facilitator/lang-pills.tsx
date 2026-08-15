"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lang {
  id: string;
  label: string;
  available: boolean;
}

// Codé en dur en Phase 0 (docs/04-SCREENS.md) — deviendra dynamique quand
// la matrice de langues sera pilotée depuis Supabase (Phase 1).
const LANGS: Lang[] = [
  { id: "fr", label: "FR", available: true },
  { id: "en", label: "EN", available: true },
  { id: "ff", label: "Fulfulde", available: false },
];

interface LangPillsProps {
  lang: string;
  onLangChange: (lang: string) => void;
}

export function LangPills({ lang, onLangChange }: LangPillsProps) {
  return (
    <div className="flex items-center gap-1.5">
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => l.available && onLangChange(l.id)}
          disabled={!l.available}
          title={l.available ? undefined : "Contenu à venir — case prête, en attente de traduction"}
          className={cn(
            "flex h-11 items-center gap-1 rounded-full border px-3 text-xs font-semibold motion-safe:transition",
            l.available
              ? lang === l.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-primary text-primary"
              : "cursor-not-allowed border-border text-muted-foreground opacity-60",
          )}
        >
          {l.label}
          {!l.available && <Clock size={11} aria-hidden="true" />}
        </button>
      ))}
    </div>
  );
}
