"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionView } from "./session-view";

/** Voir app/(facilitator)/module/page.tsx pour le rationnel complet. */
function SessionRoute() {
  const searchParams = useSearchParams();
  const moduleId = Number(searchParams.get("id"));
  return <SessionView moduleId={moduleId} />;
}

export default function SessionPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <SessionRoute />
    </Suspense>
  );
}
