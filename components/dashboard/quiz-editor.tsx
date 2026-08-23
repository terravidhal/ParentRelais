"use client";

import { useRef, useState, useTransition } from "react";
import { GraduationCap, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  createQuizQuestion,
  deleteQuizQuestion,
} from "@/app/(dashboard)/dashboard/content/actions";

export interface QuizEditorQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

/**
 * Quiz d'un module : consultation, ajout, suppression.
 *
 * Le quiz descend vers les téléphones avec son module : une question
 * ajoutée ici atteint le terrain à la synchronisation suivante. Avant la
 * migration 0019, il vivait en dur dans le code et tous les modules
 * affichaient les mêmes questions.
 */
export function QuizEditor({
  moduleId,
  moduleTitle,
  questions,
}: {
  moduleId: number;
  moduleTitle: string;
  questions: QuizEditorQuestion[];
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleAdd = (formData: FormData) => {
    startTransition(async () => {
      const result = await createQuizQuestion(formData);
      if (result.ok) {
        toast.success("Question ajoutée");
        formRef.current?.reset();
        setAdding(false);
      } else {
        toast.error("Ajout impossible", { description: result.error });
      }
    });
  };

  const handleDelete = (questionId: number) => {
    startTransition(async () => {
      const result = await deleteQuizQuestion(questionId);
      if (result.ok) toast.success("Question supprimée");
      else toast.error("Suppression impossible", { description: result.error });
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold text-muted-foreground"
      >
        <GraduationCap size={14} aria-hidden="true" />
        Quiz ({questions.length})
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-display flex items-center gap-2 text-sm font-bold">
          <GraduationCap size={15} aria-hidden="true" />
          Quiz — {moduleTitle || `Module ${moduleId}`}
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fermer le quiz"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {questions.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Aucune question. Les facilitateurs pourront terminer la séance sans
          quiz.
        </p>
      ) : (
        <ol className="mt-2 flex flex-col gap-2">
          {questions.map((q, index) => (
            <li key={q.id} className="rounded-lg border border-border bg-background p-2.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">
                  {index + 1}. {q.question}
                </p>
                <button
                  type="button"
                  onClick={() => handleDelete(q.id)}
                  disabled={isPending}
                  aria-label={`Supprimer la question ${index + 1}`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-destructive disabled:opacity-50"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
              <ul className="mt-1 flex flex-col gap-0.5 text-xs">
                {q.options.map((option, i) => (
                  <li
                    key={i}
                    className={
                      i === q.correctIndex
                        ? "font-semibold text-success"
                        : "text-muted-foreground"
                    }
                  >
                    {i === q.correctIndex ? "✓ " : "• "}
                    {option}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}

      {adding ? (
        <form ref={formRef} action={handleAdd} className="mt-3 flex flex-col gap-2">
          <input type="hidden" name="module_id" value={moduleId} />
          <label className="flex flex-col gap-1 text-xs font-semibold">
            Question (français)
            <input
              name="question"
              required
              maxLength={300}
              placeholder="Que faire quand un enfant fait une bêtise ?"
              className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal"
            />
          </label>

          {[0, 1, 2].map((i) => (
            <label key={i} className="flex items-center gap-2 text-xs font-semibold">
              <input
                type="radio"
                name="correct_index"
                value={i}
                defaultChecked={i === 0}
                aria-label={`La réponse ${i + 1} est la bonne`}
                className="h-5 w-5 shrink-0"
              />
              <input
                name={`option_${i}`}
                required={i < 2}
                maxLength={200}
                placeholder={
                  i < 2 ? `Réponse ${i + 1}` : `Réponse ${i + 1} (facultative)`
                }
                className="h-11 flex-1 rounded-xl border border-border bg-background px-3 text-sm font-normal"
              />
            </label>
          ))}
          <p className="text-xs text-muted-foreground">
            Cochez le rond devant la bonne réponse.
          </p>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="font-display h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {isPending ? "Ajout…" : "Ajouter la question"}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="h-11 rounded-xl border border-border px-3 text-sm font-semibold"
            >
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 flex h-11 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-sm font-semibold"
        >
          <Plus size={14} aria-hidden="true" />
          Ajouter une question
        </button>
      )}
    </div>
  );
}
