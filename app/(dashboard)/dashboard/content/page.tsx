import Link from "next/link";
import { Globe, Library, CheckCircle2, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ContentMatrix } from "@/components/dashboard/content-matrix";
import { MediaUploadCell } from "@/components/dashboard/media-upload-cell";
import { StatCard } from "@/components/dashboard/stat-card";
import { CreateModuleForm } from "@/components/dashboard/create-module-form";
import { ModulePublicationControls } from "@/components/dashboard/module-publication-controls";
import { TableToolbar } from "@/components/dashboard/table-toolbar";
import { QuizEditor, type QuizEditorQuestion } from "@/components/dashboard/quiz-editor";

/**
 * Server component pour la lecture ; l'upload lui-même est délégué à
 * MediaUploadCell (client) qui écrit directement dans Storage + upsert la
 * ligne module_translations, puis déclenche router.refresh().
 */
export default async function DashboardContentPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; statut?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const search = (params.q ?? "").trim().toLowerCase();
  const statusFilter = (params.statut ?? "").trim();

  // Les langues viennent du référentiel : elles étaient codées en dur ici,
  // dans la matrice, dans les actions et dans les pastilles du facilitateur —
  // cinq endroits à modifier pour ajouter une langue (migration 0021).
  const { data: languageRows } = await supabase
    .from("languages")
    .select("code, label, short_label")
    .eq("active", true)
    .order("position");

  const languages = languageRows ?? [];
  const columns = languages.map((l) => ({
    lang: l.code,
    label: l.short_label,
    fullLabel: l.label,
  }));

  const { data: modules } = await supabase
    .from("modules")
    .select("id, position, duration_min, status, archived_at")
    .order("position");

  const { data: translations } = await supabase
    .from("module_translations")
    .select("module_id, lang, title, status");

  // Le quiz de chaque module, pour que l'admin puisse le voir et le compléter
  // sans quitter la page (migration 0019).
  const { data: quizQuestions } = await supabase
    .from("quiz_questions")
    .select("id, module_id, position, correct_index")
    .order("position");

  const { data: quizTranslations } = await supabase
    .from("quiz_question_translations")
    .select("question_id, lang, question, options")
    .eq("lang", "fr");

  const rows = (modules ?? []).map((m) => {
    const statusByLang: Record<string, "ready" | "pending"> = {};
    let frenchTitle = "";
    for (const t of translations ?? []) {
      if (t.module_id === m.id) {
        statusByLang[t.lang] = t.status;
        if (t.lang === "fr") frenchTitle = t.title;
      }
    }
    const quiz: QuizEditorQuestion[] = (quizQuestions ?? [])
      .filter((q) => q.module_id === m.id)
      .map((q) => {
        const t = (quizTranslations ?? []).find((x) => x.question_id === q.id);
        return {
          id: q.id,
          question: t?.question ?? "(sans libellé)",
          options: t?.options ?? [],
          correctIndex: q.correct_index,
        };
      });

    return {
      moduleId: m.id,
      statusByLang,
      quiz,
      title: frenchTitle,
      position: m.position,
      durationMin: m.duration_min,
      published: m.status === "published",
      archived: m.archived_at !== null,
    };
  });

  // Le filtrage se fait ici plutôt qu'en base : une dizaine de modules à
  // terme, la requête reste triviale et les compteurs doivent porter sur
  // l'ensemble, pas sur la vue filtrée.
  const visibleRows = rows.filter((r) => {
    if (search && !r.title.toLowerCase().includes(search)) return false;
    if (statusFilter === "publie") return r.published && !r.archived;
    if (statusFilter === "brouillon") return !r.published && !r.archived;
    if (statusFilter === "archive") return r.archived;
    return true;
  });

  const nextPosition =
    rows.reduce((max, r) => Math.max(max, r.position), 0) + 1;
  const publishedCount = rows.filter((r) => r.published && !r.archived).length;

  const totalCells = rows.length * languages.length;
  const readyCells = rows.reduce(
    (n, r) => n + Object.values(r.statusByLang).filter((s) => s === "ready").length,
    0,
  );

  return (
    <div>
      {/* Le formulaire s'ouvre SOUS l'en-tête, en pleine largeur : logé dans
          la rangée du titre, il s'étirait vers la droite en laissant le
          titre seul dans un grand vide (constaté en capture). */}
      <div className="mb-6">
        <CreateModuleForm nextPosition={nextPosition}>
          <p className="font-display text-xs font-semibold tracking-wide text-accent-ink">
            PILOTAGE NATIONAL
          </p>
          <h1 className="font-display text-2xl font-bold">Contenus & langues</h1>
        </CreateModuleForm>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Modules"
          value={rows.length}
          icon={<Globe size={18} aria-hidden="true" />}
          color="primary"
          hint={`${publishedCount} publié(s) sur le terrain`}
        />
        <StatCard
          label="Cases prêtes"
          value={readyCells}
          icon={<CheckCircle2 size={18} aria-hidden="true" />}
          color="success"
          hint={
            totalCells > 0
              ? `${Math.round((readyCells / totalCells) * 100)} % des ${totalCells} cases`
              : undefined
          }
        />
        <StatCard
          label="En attente de contenu"
          value={totalCells - readyCells}
          icon={<Clock size={18} aria-hidden="true" />}
          color="accent"
          hint="Déposer un fichier suffit à les remplir"
        />
      </div>

      {/* Recherche commune aux deux blocs ci-dessous. */}
      <div className="mt-6 surface-raised surface-flush">
        <TableToolbar
          searchLabel="Rechercher un module"
          placeholder="Titre du module"
          filters={[
            {
              name: "statut",
              label: "Statut",
              options: [
                { value: "publie", label: "Publiés" },
                { value: "brouillon", label: "Brouillons" },
                { value: "archive", label: "Archivés" },
              ],
            },
          ]}
        />
      </div>

      <div id="tour-matrice" className="mt-4 surface-raised">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="font-display flex items-center gap-2 font-bold">
            <Globe size={16} aria-hidden="true" /> Matrice module × langue
          </h3>
          <Link
            href="/dashboard/content/media"
            className="flex h-11 items-center gap-1.5 text-sm font-semibold text-primary underline-offset-2 hover:underline"
          >
            <Library size={14} aria-hidden="true" />
            Voir tous les fichiers →
          </Link>
        </div>
        {/* La matrice suit la MÊME recherche que la liste de publication :
            deux barres distinctes sur la même page auraient été un piège —
            filtrer d'un côté sans comprendre pourquoi l'autre ne bouge pas. */}
        <ContentMatrix
          rows={visibleRows}
          columns={columns}
          renderCellAction={(moduleId, lang) => (
            <MediaUploadCell moduleId={moduleId} lang={lang} />
          )}
        />
        {visibleRows.length === 0 && rows.length > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            Aucun module ne correspond à cette recherche.
          </p>
        )}
      </div>

      {/* Publication : c'est ici, et nulle part ailleurs, que se décide ce
          qui descend vers les téléphones. */}
      <div className="mt-6 surface-raised">
        <h3 className="font-display mb-1 font-bold">Publication des modules</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Un module publié est téléchargé par les facilitateurs à leur
          prochaine synchronisation. Un module archivé en disparaît, mais
          reste lisible dans les rapports et les historiques.
        </p>


        <ul className="flex flex-col gap-3">
          {visibleRows.map((row) => {
            const pendingLangs = languages.map((l) => l.code).filter(
              (lang) => row.statusByLang[lang] !== "ready",
            );
            return (
              <li
                key={row.moduleId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
              >
                <div className="min-w-[200px] flex-1">
                  <p className="font-semibold">
                    M{row.moduleId} — {row.title || "Sans titre"}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      Position {row.position} · {row.durationMin} min
                    </span>
                    <span
                      className={
                        row.archived
                          ? "rounded-full bg-muted px-2 py-0.5 font-semibold text-muted-foreground"
                          : row.published
                            ? "rounded-full bg-success-soft px-2 py-0.5 font-semibold text-success"
                            : "rounded-full bg-accent/15 px-2 py-0.5 font-semibold text-accent-ink"
                      }
                    >
                      {row.archived
                        ? "Archivé"
                        : row.published
                          ? "Publié"
                          : "Brouillon"}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <QuizEditor
                    moduleId={row.moduleId}
                    moduleTitle={row.title}
                    questions={row.quiz}
                  />
                  <ModulePublicationControls
                    moduleId={row.moduleId}
                    published={row.published}
                    archived={row.archived}
                    pendingLangs={pendingLangs}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        {visibleRows.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {rows.length === 0
              ? "Aucun module pour l'instant. Créez le premier avec « Nouveau module »."
              : "Aucun module ne correspond à cette recherche."}
          </p>
        )}
      </div>
    </div>
  );
}
