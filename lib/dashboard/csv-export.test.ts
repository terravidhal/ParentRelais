import { describe, expect, it } from "vitest";
import { sessionsToCsv } from "./csv-export";
import type { SessionRow } from "@/lib/supabase/types";

function sampleRow(overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    client_uuid: "8fddf084-4a7d-4413-b6ba-648334ea0cdf",
    facilitator_id: "abfd9c91-252f-45ed-b54f-9809c0868107",
    module_id: 1,
    region: "Extrême-Nord",
    locality: "Maroua",
    parents_total: 12,
    women: 8,
    disability_count: 1,
    quiz_score: 2,
    quiz_max: 2,
    held_at: "2026-08-15T14:23:37.566Z",
    synced_at: "2026-08-15T14:24:00.000Z",
    ...overrides,
  };
}

describe("sessionsToCsv", () => {
  it("génère un en-tête suivi d'une ligne par séance", () => {
    const csv = sessionsToCsv([sampleRow()]);
    const lines = csv.split("\n");

    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(
      "client_uuid,facilitator_id,region,locality,parents_total,women,disability_count,quiz_score,quiz_max,held_at,synced_at",
    );
    expect(lines[1]).toContain("Maroua");
    expect(lines[1]).toContain("12");
  });

  it("liste vide ne produit que l'en-tête", () => {
    const csv = sessionsToCsv([]);
    expect(csv.split("\n")).toHaveLength(1);
  });

  it("échappe une localité contenant une virgule", () => {
    const csv = sessionsToCsv([sampleRow({ locality: "Maroua, quartier Domayo" })]);
    expect(csv).toContain('"Maroua, quartier Domayo"');
  });

  it("échappe et double les guillemets internes", () => {
    const csv = sessionsToCsv([sampleRow({ locality: 'Village "test"' })]);
    expect(csv).toContain('"Village ""test"""');
  });

  it("ne quote pas les champs numériques ou sans caractère spécial", () => {
    const csv = sessionsToCsv([sampleRow()]);
    const dataLine = csv.split("\n")[1];
    expect(dataLine).not.toContain('"12"');
    expect(dataLine.startsWith('"')).toBe(false);
  });

  it("gère plusieurs lignes dans le bon ordre", () => {
    const csv = sessionsToCsv([
      sampleRow({ client_uuid: "uuid-1", locality: "Maroua" }),
      sampleRow({ client_uuid: "uuid-2", locality: "Mokolo" }),
    ]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("Maroua");
    expect(lines[2]).toContain("Mokolo");
  });
});
