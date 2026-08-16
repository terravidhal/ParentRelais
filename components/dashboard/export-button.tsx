"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sessionsToCsv } from "@/lib/dashboard/csv-export";
import type { SessionRow } from "@/lib/supabase/types";

interface ExportButtonProps {
  rows: SessionRow[];
}

/**
 * Génère le CSV côté client à partir des données déjà chargées par le
 * server component parent — pas de route API dédiée (CLAUDE.md règle 5),
 * pas de dépendance externe pour le téléchargement (Blob + lien standard).
 */
export function ExportButton({ rows }: ExportButtonProps) {
  const handleExport = () => {
    const csv = sessionsToCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `parentrelais-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      onClick={handleExport}
      disabled={rows.length === 0}
      className="h-11 gap-2 font-semibold"
    >
      <Download size={16} aria-hidden="true" />
      Exporter en CSV ({rows.length})
    </Button>
  );
}
