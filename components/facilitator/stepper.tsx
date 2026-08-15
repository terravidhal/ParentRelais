"use client";

import type { ReactNode } from "react";
import { Minus, Plus } from "lucide-react";

interface StepperProps {
  label: string;
  icon: ReactNode;
  value: number;
  onChange: (value: number) => void;
  max?: number;
}

/** Boutons +/- ≥44px (accessibilité, docs/05-DESIGN-SYSTEM.md). */
export function Stepper({ label, icon, value, onChange, max = 60 }: StepperProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-background p-3">
      <span className="font-display flex items-center gap-2 text-sm font-semibold">
        {icon}
        {label}
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Diminuer ${label}`}
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card"
        >
          <Minus size={16} aria-hidden="true" />
        </button>
        <span className="font-display w-8 text-center text-lg font-bold">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Augmenter ${label}`}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
