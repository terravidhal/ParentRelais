import type { ReactNode } from "react";
import { CheckCircle2, Clock } from "lucide-react";

export interface MatrixLanguage {
  lang: string;
  label: string;
  fullLabel: string;
}

// Largeurs minimales par colonne pour rester lisible même en scroll
// horizontal sur mobile — grid-cols-5 seul débordait/écrasait le texte.
/** Calculée à l'exécution : le nombre de langues n'est plus figé. */
function gridTemplate(count: number): string {
  return `minmax(140px,1.4fr) repeat(${count}, minmax(90px,1fr))`;
}

interface ContentMatrixRow {
  moduleId: number;
  statusByLang: Record<string, "ready" | "pending">;
  /** Titre français, pour repérer un module autrement que par son numéro. */
  title?: string;
}

interface ContentMatrixProps {
  rows: ContentMatrixRow[];
  /** Colonnes du référentiel serveur (migration 0021) : ajouter une langue
   *  n'exige plus de modifier ce composant. */
  columns: MatrixLanguage[];
  /**
   * Slot optionnel rendu sous l'icône de statut de chaque cellule — permet
   * au dashboard d'y injecter un bouton d'upload (voir MediaUploadCell)
   * sans que ce composant de présentation dépende de Supabase Storage.
   */
  renderCellAction?: (moduleId: number, lang: string) => ReactNode;
}

export function ContentMatrix({
  rows,
  columns,
  renderCellAction,
}: ContentMatrixProps) {
  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <div className="grid text-xs font-semibold"
          style={{ gridTemplateColumns: gridTemplate(columns.length) }}>
          <div className="col-span-1 bg-background p-2">Module</div>
          {columns.map((c) => (
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
            className="grid items-center border-t border-border text-sm"
            style={{ gridTemplateColumns: gridTemplate(columns.length) }}
          >
            <div className="p-2">
              <span className="font-medium">M{row.moduleId}</span>
              {row.title && (
                <span className="block truncate text-xs text-muted-foreground">
                  {row.title}
                </span>
              )}
            </div>
            {columns.map((c) => (
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
