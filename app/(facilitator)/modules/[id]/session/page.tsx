import { SEED_MODULES } from "@/lib/content/seed";
import { SessionView } from "./session-view";

/** Voir app/(facilitator)/modules/[id]/page.tsx pour le rationnel complet. */
export function generateStaticParams() {
  return SEED_MODULES.map((module) => ({ id: String(module.id) }));
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SessionView moduleId={Number(id)} />;
}
