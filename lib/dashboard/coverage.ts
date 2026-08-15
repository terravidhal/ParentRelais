export interface CoverageDatum {
  label: string;
  value: number;
}

export interface CoverageBar extends CoverageDatum {
  percent: number;
}

/**
 * Calcule la largeur proportionnelle (0-100) de chaque barre par rapport au
 * maximum. Le plancher à 1 sur le max évite une division par zéro quand
 * toutes les valeurs sont à 0 (docs/04-SCREENS.md : état vide géré ailleurs,
 * ceci ne gère que le cas "données présentes mais toutes nulles").
 */
export function computeCoverageBars(data: CoverageDatum[]): CoverageBar[] {
  const max = Math.max(1, ...data.map((d) => d.value));
  return data.map((d) => ({
    ...d,
    percent: (d.value / max) * 100,
  }));
}
