import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  color?: "primary" | "success" | "accent";
}

const COLOR_CLASSES: Record<NonNullable<StatCardProps["color"]>, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success-soft text-success",
  accent: "bg-accent-soft text-accent-ink",
};

export function StatCard({ label, value, icon, color = "primary" }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <div
          className={cn(
            "mb-2 flex h-9 w-9 items-center justify-center rounded-full",
            COLOR_CLASSES[color],
          )}
        >
          {icon}
        </div>
        <div className="font-display text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
