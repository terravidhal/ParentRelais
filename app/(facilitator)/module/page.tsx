"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ModuleView } from "./module-view";

/**
 * Route UNIQUE pour tous les modules : l'identifiant voyage en paramètre
 * d'URL (`/module?id=3`) au lieu d'un segment dynamique.
 *
 * Pourquoi : l'ancienne route `/modules/[id]` était pré-rendue au build via
 * generateStaticParams() à partir du catalogue en dur, ce qui permettait à
 * Serwist de précacher chaque page pour le hors-ligne (CLAUDE.md règle 1).
 * Maintenant que le contenu vient de Supabase à l'exécution, Next ne peut
 * plus connaître la liste des modules au build — un module créé après le
 * déploiement n'aurait aucune page précachée.
 *
 * Une route unique et statique résout les deux contraintes à la fois : une
 * seule page à précacher, valable pour n'importe quel module, présent ou
 * futur. Voir 13-PLAN-CONTENU.md.
 */
function ModuleRoute() {
  const searchParams = useSearchParams();
  const id = Number(searchParams.get("id"));
  return <ModuleView id={id} />;
}

export default function ModulePage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <ModuleRoute />
    </Suspense>
  );
}
