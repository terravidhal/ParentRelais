"use client";

import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectivityBannerProps {
  online: boolean;
  pendingCount: number;
}

/**
 * L'information la plus importante pour un facilitateur (docs/05-DESIGN-SYSTEM.md).
 * La couleur seule ne porte jamais le sens : le texte "En ligne"/"Hors-ligne"
 * est toujours présent à côté de l'icône (accessibilité, CLAUDE.md).
 */
export function ConnectivityBanner({
  online,
  pendingCount,
}: ConnectivityBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-4 py-3",
        online ? "bg-success-soft text-success" : "bg-destructive-soft text-destructive",
      )}
    >
      <div className="flex items-center gap-2">
        {online ? (
          <Wifi size={18} aria-hidden="true" />
        ) : (
          <WifiOff size={18} aria-hidden="true" />
        )}
        <span className="font-display text-sm font-semibold">
          {online ? "En ligne" : "Hors-ligne"}
        </span>
        {pendingCount > 0 && (
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
            {pendingCount} à synchroniser
          </span>
        )}
      </div>
    </div>
  );
}
