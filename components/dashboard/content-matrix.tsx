import type { ReactNode } from "react";
import { CheckCircle2, Clock } from "lucide-react";

const COLUMNS = [
  { lang: "fr", label: "FR" },
  { lang: "en", label: "EN" },
  { lang: "ff", label: "Fulfulde" },
  { lang: "sign", label: "Langue des signes" },
] as const;

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
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-5 text-xs font-semibold">
          <div className="col-span-1 bg-background p-2">Module</div>
          {COLUMNS.map((c) => (
            <div key={c.lang} className="bg-background p-2 text-center">
              {c.label}
            </div>
          ))}
        </div>
        {rows.map((row) => (
          <div
            key={row.moduleId}
            className="grid grid-cols-5 items-center border-t border-border text-sm"
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
                    className="text-accent"
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
        <Clock size={11} className="inline text-accent" aria-hidden="true" /> case
        prête, en attente de contenu. Ajouter une langue = déposer un fichier,
        sans retoucher l&apos;application.
      </p>
    </div>
  );
}
