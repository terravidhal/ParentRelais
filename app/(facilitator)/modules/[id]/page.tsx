import { SEED_MODULES } from "@/lib/content/seed";
import { ModuleView } from "./module-view";

/**
 * Pré-rend statiquement /modules/{id} pour chaque module du seed, afin que
 * Serwist puisse précacher le document HTML au build (CLAUDE.md règle 1 :
 * routes facilitateur jamais dépendantes d'un fetch serveur, précachées
 * intégralement — sans ceci, la route resterait dynamique et échouerait en
 * navigation offline avant toute visite préalable en ligne).
 */
export function generateStaticParams() {
  return SEED_MODULES.map((module) => ({ id: String(module.id) }));
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ModuleView id={Number(id)} />;
}
