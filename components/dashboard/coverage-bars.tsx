import { computeCoverageBars, type CoverageDatum } from "@/lib/dashboard/coverage";

interface CoverageBarsProps {
  data: CoverageDatum[];
}

/**
 * Le chiffre est affiché À CÔTÉ de la barre, pas dedans : une localité à 4
 * familles sur un maximum de 480 donne une barre de 0,8 % de large, dans
 * laquelle la valeur était illisible (constat visuel). Tri décroissant pour
 * que la lecture aille du plus important au moins important.
 */
export function CoverageBars({ data }: CoverageBarsProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune donnée pour l&apos;instant. Depuis l&apos;app facilitateur, animez une
        séance puis synchronisez.
      </p>
    );
  }

  const bars = computeCoverageBars(data).sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col gap-3">
      {bars.map(({ label, value, percent }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="w-24 truncate text-sm font-medium" title={label}>
            {label}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              // Plancher visuel : en dessous de ~2 %, la barre disparaît
              // complètement et la ligne semble vide.
              className="h-full rounded-full bg-primary motion-safe:transition-all"
              style={{ width: `${Math.max(percent, value > 0 ? 2 : 0)}%` }}
            />
          </div>
          <span className="font-display w-14 text-right text-sm font-bold tabular-nums">
            {value.toLocaleString("fr-FR")}
          </span>
        </div>
      ))}
    </div>
  );
}
