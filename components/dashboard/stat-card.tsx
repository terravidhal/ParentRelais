import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  color?: "primary" | "success" | "accent";
  /** Phrase courte qui donne du sens au chiffre plutôt que de le laisser nu. */
  hint?: string;
}

const COLOR_CLASSES: Record<NonNullable<StatCardProps["color"]>, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success-soft text-success",
  accent: "bg-accent-soft text-accent-ink",
};

/**
 * Ordre de lecture repris des blocks officiels shadcn : le libellé annonce
 * la mesure, le chiffre domine, la phrase de contexte suit. L'ancienne
 * version empilait icône / chiffre / libellé minuscule, ce qui donnait un
 * simple nombre dans une boîte, sans hiérarchie lisible.
 *
 * `tabular-nums` : les chiffres gardent la même largeur, donc les valeurs
 * restent alignées d'une carte à l'autre au lieu de danser.
 */
export function StatCard({
  label,
  value,
  icon,
  color = "primary",
  hint,
}: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              COLOR_CLASSES[color],
            )}
          >
            {icon}
          </span>
        </div>
        <p className="font-display mt-2 text-3xl font-bold tabular-nums">
          {value.toLocaleString("fr-FR")}
        </p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
