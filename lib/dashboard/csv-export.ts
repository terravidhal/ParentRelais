import type { SessionRow } from "@/lib/supabase/types";

const HEADERS = [
  "client_uuid",
  "facilitator_id",
  "region",
  "locality",
  "parents_total",
  "women",
  "disability_count",
  "quiz_score",
  "quiz_max",
  "held_at",
  "synced_at",
] as const;

/**
 * Échappe un champ CSV : entoure de guillemets et double les guillemets
 * internes si le champ contient une virgule, un guillemet ou un saut de
 * ligne — RFC 4180. Sans ça, une localité comme `"Maroua, quartier X"`
 * casserait le parsing dans Excel/Sheets.
 */
function escapeCsvField(value: string | number | null): string {
  const str = value === null ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Construit un CSV depuis des lignes `sessions` — pure, testable sans DOM.
 * Le téléchargement lui-même (Blob + lien) vit dans le composant client
 * ExportButton, qui n'appelle que cette fonction.
 */
export function sessionsToCsv(rows: SessionRow[]): string {
  const lines = [HEADERS.join(",")];
  for (const row of rows) {
    lines.push(
      HEADERS.map((key) => escapeCsvField(row[key])).join(","),
    );
  }
  return lines.join("\n");
}
