import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeadingProps {
  children: ReactNode;
  className?: string;
}

export function PageHeading({ children, className }: PageHeadingProps) {
  return (
    <h1 className={cn("font-display text-xl font-bold", className)}>
      {children}
    </h1>
  );
}
