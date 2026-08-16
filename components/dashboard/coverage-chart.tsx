"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { CoverageDatum } from "@/lib/dashboard/coverage";

interface CoverageChartProps {
  data: CoverageDatum[];
}

const chartConfig = {
  value: {
    label: "Familles touchées",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

/**
 * Seconde vue sur les mêmes données que CoverageBars — aucune nouvelle
 * requête, aucune migration, juste une représentation visuelle différente
 * (barres Recharts) des agrégats déjà chargés par dashboard/page.tsx.
 */
export function CoverageChart({ data }: CoverageChartProps) {
  if (data.length === 0) {
    return null;
  }

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={6} />
      </BarChart>
    </ChartContainer>
  );
}
