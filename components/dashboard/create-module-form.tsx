"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { createModule } from "@/app/(dashboard)/dashboard/content/actions";

/**
 * Création d'un module depuis le tableau de bord.
 *
 * Le module naît en BROUILLON : il n'atteint les téléphones qu'une fois
 * publié explicitement. C'est ce qui permet de préparer un contenu
 * incomplet (titre posé, audio pas encore enregistré) sans l'imposer au
 * terrain entre-temps.
 */
export function CreateModuleForm({
  nextPosition,
  children,
}: {
  nextPosition: number;
  /** En-tête de page, rendu à gauche du bouton d'ouverture. */
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await createModule(formData);
      if (result.ok) {
        toast.success("Module créé", {
          description:
            "Il est en brouillon : publiez-le pour l'envoyer aux facilitateurs.",
        });
        formRef.current?.reset();
        setOpen(false);
      } else {
        toast.error("Création impossible", { description: result.error });
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>{children}</div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="font-display flex h-11 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            <Plus size={16} aria-hidden="true" />
            Nouveau module
          </button>
        )}
      </div>

      {!open ? null : (
        <form
          ref={formRef}
          action={handleSubmit}
          className="surface-raised mt-4 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold">Nouveau module</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Annuler la création"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Titre (français)
            <input
              name="title"
              required
              maxLength={200}
              placeholder="La perception de l'enfance"
              className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Résumé (français)
            <textarea
              name="summary"
              rows={3}
              maxLength={1000}
              placeholder="Ce que les parents retiendront de la séance."
              className="rounded-xl border border-border bg-background p-3 text-sm font-normal"
            />
          </label>

          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1 text-sm font-semibold">
              Durée (minutes)
              <input
                name="duration_min"
                type="number"
                min={1}
                max={480}
                defaultValue={45}
                required
                className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm font-semibold">
              Position
              <input
                name="position"
                type="number"
                min={1}
                defaultValue={nextPosition}
                required
                className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal"
              />
            </label>
          </div>

          <p className="text-xs text-muted-foreground">
            Les cases de langue (FR, EN, Fulfulde, LSF) sont créées vides : il
            suffira d&apos;y déposer un fichier depuis la matrice.
          </p>

          <button
            type="submit"
            disabled={isPending}
            className="font-display h-11 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {isPending ? "Création…" : "Créer le module"}
          </button>
        </form>
      )}
    </>
  );
}
