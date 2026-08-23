"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReferenceDataQuery } from "@/lib/hooks/use-reference-data";

interface LangPillsProps {
  lang: string;
  onLangChange: (lang: string) => void;
  /**
   * Langues réellement disponibles pour le module affiché. Omis sur
   * l'accueil, où aucun module précis n'est en contexte : toutes les langues
   * du référentiel sont alors proposées.
   */
  availableLangs?: string[];
}

/**
 * Sélecteur de langue.
 *
 * Les langues viennent du référentiel serveur, plus d'une constante : elles
 * étaient codées en dur ici ET dans quatre autres fichiers, ce qui rendait
 * fausse la promesse « ajouter une langue = remplir une case ».
 *
 * La disponibilité est calculée à partir du contenu réel. L'ancienne version
 * codait `available: false` pour le Fulfulde alors qu'un audio fulfulde
 * existait en base : l'application cachait un contenu qu'elle possédait.
 */
export function LangPills({ lang, onLangChange, availableLangs }: LangPillsProps) {
  const { data: reference } = useReferenceDataQuery();
  const languages = reference?.languages ?? [];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {languages.map((l) => {
        const available = availableLangs ? availableLangs.includes(l.code) : true;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => available && onLangChange(l.code)}
            disabled={!available}
            aria-pressed={lang === l.code}
            lang={l.code === "sign" ? undefined : l.code}
            title={
              available
                ? l.label
                : `${l.label} — contenu à venir, en attente de traduction`
            }
            className={cn(
              "flex min-h-11 items-center gap-1 rounded-full border px-3 text-sm font-semibold",
              lang === l.code
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground",
              !available && "opacity-50",
            )}
          >
            {l.short_label}
            {!available && <Clock size={13} aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}
