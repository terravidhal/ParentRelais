"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CachedModule } from "@/lib/db/dexie";

interface ModuleCardProps {
  module: CachedModule;
  lang: string;
  onOpen: (module: CachedModule) => void;
  className?: string;
}

export function ModuleCard({ module, lang, onOpen, className }: ModuleCardProps) {
  const translation =
    module.translations.find((t) => t.lang === lang) ??
    module.translations.find((t) => t.lang === "fr");

  if (!translation) return null;

  return (
    <button
      type="button"
      onClick={() => onOpen(module)}
      className={cn(
        "rounded-2xl border border-border bg-card p-4 text-left motion-safe:transition motion-safe:active:scale-[0.99]",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-display rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
          Module {module.id}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock size={12} aria-hidden="true" />
          {module.duration_min} min
        </span>
      </div>
      <div lang={translation.lang}>
        <h3 className="font-display mt-2 font-bold">{translation.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{translation.summary}</p>
      </div>
    </button>
  );
}
