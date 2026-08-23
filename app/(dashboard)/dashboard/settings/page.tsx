import { createClient } from "@/lib/supabase/server";
import { ReferenceSettings } from "@/components/dashboard/reference-settings";

/**
 * Référentiel du programme : langues, régions, localités.
 *
 * Ces listes vivaient en dur dans le code — cinq fichiers rien que pour les
 * langues. Les piloter depuis ici est ce qui rend vraie la promesse affichée
 * sur la landing : « ajouter une langue = remplir une case, sans refonte ».
 */
export default async function DashboardSettingsPage() {
  const supabase = await createClient();

  const [{ data: languages }, { data: regions }, { data: localities }] =
    await Promise.all([
      supabase
        .from("languages")
        .select("code, label, short_label, active")
        .order("position"),
      supabase
        .from("regions")
        .select("id, name")
        .eq("active", true)
        .order("position"),
      supabase
        .from("localities")
        .select("region_id, name")
        .eq("active", true)
        .order("position"),
    ]);

  return (
    <div>
      <div className="mb-6">
        <p className="font-display text-xs font-semibold tracking-wide text-accent-ink">
          PILOTAGE NATIONAL
        </p>
        <h1 className="font-display text-2xl font-bold">Référentiel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Langues, régions et localités du programme. Une modification ici se
          répercute sur les téléphones à la synchronisation suivante.
        </p>
      </div>

      <ReferenceSettings
        languages={(languages ?? []).map((l) => ({
          code: l.code,
          label: l.label,
          shortLabel: l.short_label,
          active: l.active,
        }))}
        regions={(regions ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          localities: (localities ?? [])
            .filter((l) => l.region_id === r.id)
            .map((l) => l.name),
        }))}
      />
    </div>
  );
}
