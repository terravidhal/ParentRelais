import { describe, expect, it } from "vitest";
import { computeCoverageBars } from "./coverage";

describe("computeCoverageBars", () => {
  it("calcule 100% pour la valeur la plus haute", () => {
    const result = computeCoverageBars([
      { label: "Maroua", value: 40 },
      { label: "Mokolo", value: 20 },
    ]);

    expect(result[0].percent).toBe(100);
    expect(result[1].percent).toBe(50);
  });

  it("gère une seule localité (100%)", () => {
    const result = computeCoverageBars([{ label: "Maroua", value: 12 }]);
    expect(result[0].percent).toBe(100);
  });

  it("ne divise pas par zéro quand toutes les valeurs sont nulles", () => {
    const result = computeCoverageBars([
      { label: "Maroua", value: 0 },
      { label: "Mokolo", value: 0 },
    ]);

    expect(result.every((b) => Number.isFinite(b.percent))).toBe(true);
    expect(result.every((b) => b.percent === 0)).toBe(true);
  });

  it("liste vide retourne un tableau vide", () => {
    expect(computeCoverageBars([])).toEqual([]);
  });

  it("préserve label et value d'origine", () => {
    const result = computeCoverageBars([{ label: "Kousséri", value: 7 }]);
    expect(result[0].label).toBe("Kousséri");
    expect(result[0].value).toBe(7);
  });
});
