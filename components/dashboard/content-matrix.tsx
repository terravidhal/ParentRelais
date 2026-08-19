import type { ReactNode } from "react";
import { CheckCircle2, Clock } from "lucide-react";

const COLUMNS = [
  { lang: "fr", label: "FR", fullLabel: "Français" },
  { lang: "en", label: "EN", fullLabel: "Anglais" },
  { lang: "ff", label: "Fulfulde", fullLabel: "Fulfulde" },
  { lang: "sign", label: "LSF", fullLabel: "Langue des signes" },
] as const;

// Largeurs minimales par colonne pour rester lisible même en scroll
// horizontal sur mobile — grid-cols-5 seul débordait/écrasait le texte.
const GRID_TEMPLATE =
  "grid-cols-[minmax(80px,1fr)_repeat(4,minmax(90px,1fr))]";

interface ContentMatrixRow {
  moduleId: number;
  statusByLang: Record<string, "ready" | "pending">;
}

interface ContentMatrixProps {
  rows: ContentMatrixRow[];
  /**
   * Slot optionnel rendu sous l'icône de statut de chaque cellule — permet
   * au dashboard d'y injecter un bouton d'upload (voir MediaUploadCell)
   * sans que ce composant de présentation dépende de Supabase Storage.
   */
  renderCellAction?: (moduleId: number, lang: string) => ReactNode;
}

export function ContentMatrix({ rows, renderCellAction }: ContentMatrixProps) {
  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <div className={`grid ${GRID_TEMPLATE} text-xs font-semibold`}>
          <div className="col-span-1 bg-background p-2">Module</div>
          {COLUMNS.map((c) => (
            <div
              key={c.lang}
              className="bg-background p-2 text-center"
              title={c.fullLabel}
            >
              {c.label}
            </div>
          ))}
        </div>
        {rows.map((row) => (
          <div
            key={row.moduleId}
            className={`grid ${GRID_TEMPLATE} items-center border-t border-border text-sm`}
          >
            <div className="p-2 font-medium">M{row.moduleId}</div>
            {COLUMNS.map((c) => (
              <div key={c.lang} className="flex flex-col items-center gap-1 p-2">
                {row.statusByLang[c.lang] === "ready" ? (
                  <CheckCircle2
                    size={16}
                    className="text-success"
                    aria-label="Prêt"
                  />
                ) : (
                  <Clock
                    size={15}
                    className="text-accent-ink"
                    aria-label="À venir"
                  />
                )}
                {renderCellAction?.(row.moduleId, c.lang)}
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        <CheckCircle2 size={11} className="inline text-success" aria-hidden="true" />{" "}
        prêt ·{" "}
        <Clock size={11} className="inline text-accent-ink" aria-hidden="true" /> case
        prête, en attente de contenu. Ajouter une langue = déposer un fichier,
        sans retoucher l&apos;application.
      </p>
    </div>
  );
}
