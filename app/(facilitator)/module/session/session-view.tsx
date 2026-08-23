"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, MapPin, Users, Circle, Accessibility, GraduationCap, CheckCircle2 } from "lucide-react";
import { useModuleQuery } from "@/lib/hooks/use-modules-query";
import { useFacilitatorSessionQuery } from "@/lib/hooks/use-facilitator-session";
import { useAddSessionMutation } from "@/lib/hooks/use-add-session-mutation";
import { usePreferredLangQuery } from "@/lib/hooks/use-preferred-lang";
import { Stepper } from "@/components/facilitator/stepper";
import { QuizStep } from "@/components/facilitator/quiz-step";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VILLAGES } from "@/lib/content/session-data";

type Step = 0 | 1 | 2;

export function SessionView({ moduleId }: { moduleId: number }) {
  const router = useRouter();
  const { data: module, isLoading } = useModuleQuery(moduleId);
  const { data: session } = useFacilitatorSessionQuery();
  const addSessionMutation = useAddSessionMutation();

  const [step, setStep] = useState<Step>(0);
  const [village, setVillage] = useState<string>(VILLAGES[0]);
  const [total, setTotal] = useState(12);
  const [women, setWomen] = useState(8);
  const [disability, setDisability] = useState(1);
  // Les réponses ne peuvent pas être dimensionnées ici : le quiz appartient
  // au module et n'est connu qu'une fois celui-ci chargé depuis Dexie. Un
  // objet indexé par identifiant de question évite d'avoir à redimensionner
  // un tableau au chargement.
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const { data: lang = "fr" } = usePreferredLangQuery();
  const [recorded, setRecorded] = useState(false);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!module || !session) {
    return <p className="text-sm text-muted-foreground">Séance indisponible.</p>;
  }

  const translation =
    module.translations.find((t) => t.lang === lang) ?? module.translations[0];

  // Le quiz vient du MODULE, plus d'une constante globale : c'est ce qui
  // faisait afficher les mêmes questions partout (migration 0019).
  const quiz = module.quiz ?? [];
  const score = quiz.reduce<number>(
    (n, q) => n + (answers[q.id] === q.correct_index ? 1 : 0),
    0,
  );
  const allAnswered = quiz.every((q) => answers[q.id] !== undefined);

  const enterRecap = async () => {
    setStep(2);
    if (recorded) return;
    try {
      // Écriture locale dès l'entrée en récap (pas seulement au clic final) :
      // la séance existe déjà même si l'app est fermée avant "Revenir à l'accueil".
      await addSessionMutation.mutateAsync({
        facilitator_id: session.facilitator_id,
        module_id: moduleId,
        region: session.region,
        locality: village,
        parents_total: total,
        women,
        disability_count: disability,
        quiz_score: score,
        quiz_max: quiz.length,
        held_at: new Date().toISOString(),
      });
      setRecorded(true);
    } catch (error: unknown) {
      console.error("[session] enregistrement de la séance échoué:", error);
    }
  };

  const STEP_LABELS = ["Présences", "Quiz", "Terminé"] as const;

  return (
    <div className="lg:mx-auto lg:max-w-4xl">
      <button
        type="button"
        onClick={() => router.push(`/module?id=${moduleId}`)}
        className="mb-3 flex h-12 items-center gap-1.5 text-base font-semibold text-primary"
      >
        <ChevronLeft size={20} aria-hidden="true" /> {translation.title}
      </button>

      {/* Le formulaire garde une largeur de lecture confortable : un flux
          d'étapes étiré sur 1440px devient pénible à remplir. On compose
          plutôt un rappel de contexte à côté, visible seulement en desktop. */}
      <div className="lg:grid lg:grid-cols-[1fr_240px] lg:items-start lg:gap-8">
      <div>
      <div className="mb-4 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-border"}`}
          />
        ))}
      </div>

      {step === 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-display font-bold">Qui est présent aujourd&apos;hui ?</h3>
          <div className="rounded-2xl border border-border bg-background p-3">
            <label className="font-display flex items-center gap-2 text-sm font-semibold">
              <MapPin size={15} aria-hidden="true" /> Village
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {VILLAGES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVillage(v)}
                  className={`h-11 rounded-full border border-border px-3 text-sm font-semibold ${
                    village === v
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <Stepper label="Parents présents" icon={<Users size={16} />} value={total} onChange={setTotal} />
          <Stepper label="Dont femmes" icon={<Circle size={16} />} value={women} onChange={setWomen} max={total} />
          <Stepper
            label="En situation de handicap"
            icon={<Accessibility size={16} />}
            value={disability}
            onChange={setDisability}
            max={total}
          />
          <Button onClick={() => setStep(1)} className="font-display mt-1 h-11 font-bold">
            Continuer
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h3 className="font-display flex items-center gap-2 font-bold">
            <GraduationCap size={18} aria-hidden="true" /> Petit quiz de fin
          </h3>
          {quiz.length === 0 ? (
            // Un module sans quiz doit pouvoir se terminer : le facilitateur
            // ne doit jamais rester bloqué sur une étape vide.
            <p className="text-sm text-muted-foreground">
              Ce module n&apos;a pas encore de quiz. Vous pouvez terminer la
              séance.
            </p>
          ) : (
            quiz.map((question) => (
              <QuizStep
                key={question.id}
                question={question}
                lang={lang}
                selected={answers[question.id]}
                onAnswer={(optionIndex) =>
                  setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))
                }
              />
            ))
          )}
          <Button
            onClick={enterRecap}
            disabled={!allAnswered}
            className="font-display h-11 font-bold"
          >
            Terminer la séance
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="mt-2 flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
            <CheckCircle2 size={32} className="text-success" aria-hidden="true" />
          </div>
          <h3 className="font-display text-lg font-bold">Séance enregistrée</h3>
          <p className="text-sm text-muted-foreground">
            {village} · {total} parents · {disability} en situation de handicap
            {quiz.length > 0 && ` · quiz ${score}/${quiz.length}`}
          </p>
          <div className="w-full rounded-2xl bg-accent-soft p-3 text-sm text-accent-ink">
            Enregistré sur l&apos;appareil. La séance sera envoyée dès qu&apos;une
            connexion sera disponible.
          </div>
          <Button
            onClick={() => router.push("/home")}
            className="font-display h-11 w-full font-bold"
          >
            Revenir à l&apos;accueil
          </Button>
        </div>
      )}
      </div>

      {/* Rappel du module animé et de l'étape en cours : pendant une séance,
          le facilitateur parle aux parents et perd facilement le fil. */}
      <aside className="mt-6 hidden lg:mt-0 lg:block">
        <div className="surface">
          <p className="text-xs font-semibold text-muted-foreground">
            Séance en cours
          </p>
          <p className="font-display mt-1 text-sm font-semibold">
            {translation.title}
          </p>
          <ol className="mt-3 flex flex-col gap-2">
            {STEP_LABELS.map((label, i) => (
              <li
                key={label}
                className={`flex items-center gap-2 text-sm ${
                  i === step
                    ? "font-semibold text-foreground"
                    : i < step
                      ? "text-success"
                      : "text-muted-foreground"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    i === step
                      ? "bg-primary text-primary-foreground"
                      : i < step
                        ? "bg-success-soft text-success"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? "✓" : i + 1}
                </span>
                {label}
              </li>
            ))}
          </ol>
        </div>
      </aside>
      </div>
    </div>
  );
}
