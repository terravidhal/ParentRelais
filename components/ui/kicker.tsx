import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KickerProps {
  children: ReactNode;
  variant?: "accent" | "brand";
  className?: string;
}

/**
 * Petit label de marque ("PARENTRELAIS") répété en tête de plusieurs écrans
 * — variant "brand" pour les surfaces de marque (login), "accent" ailleurs
 * (cohérent avec l'usage existant de --accent dans l'UI applicative).
 */
export function Kicker({ children, variant = "accent", className }: KickerProps) {
  return (
    <p
      className={cn(
        "font-display text-xs font-semibold tracking-wide",
        variant === "brand" ? "text-brand-accent-ink" : "text-accent-ink",
        className,
      )}
    >
      {children}
    </p>
  );
}
