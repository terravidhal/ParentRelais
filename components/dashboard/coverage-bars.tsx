import { computeCoverageBars, type CoverageDatum } from "@/lib/dashboard/coverage";

interface CoverageBarsProps {
  data: CoverageDatum[];
}

export function CoverageBars({ data }: CoverageBarsProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune donnée pour l&apos;instant. Depuis l&apos;app facilitateur, animez une
        séance puis synchronisez.
      </p>
    );
  }

  const bars = computeCoverageBars(data);

  return (
    <div className="flex flex-col gap-2.5">
      {bars.map(({ label, value, percent }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="font-display w-20 text-sm font-semibold">{label}</span>
          <div className="h-6 flex-1 overflow-hidden rounded-full bg-background">
            <div
              className="flex h-full items-center justify-end rounded-full bg-primary pr-2 motion-safe:transition-all"
              style={{ width: `${percent}%` }}
            >
              <span className="text-xs font-bold text-primary-foreground">
                {value}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
