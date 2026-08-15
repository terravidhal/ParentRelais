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
import { VILLAGES, DEMO_QUIZ } from "@/lib/content/seed";

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
  const [answers, setAnswers] = useState<(number | null)[]>(
    DEMO_QUIZ.map(() => null),
  );
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
  const score = answers.reduce<number>(
    (n, a, i) => n + (a === DEMO_QUIZ[i].correct ? 1 : 0),
    0,
  );
  const allAnswered = answers.every((a) => a !== null);

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
        quiz_max: DEMO_QUIZ.length,
        held_at: new Date().toISOString(),
      });
      setRecorded(true);
    } catch (error: unknown) {
      console.error("[session] enregistrement de la séance échoué:", error);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => router.push(`/modules/${moduleId}`)}
        className="mb-3 flex h-11 items-center gap-1 text-sm font-semibold text-primary"
      >
        <ChevronLeft size={16} aria-hidden="true" /> {translation.title}
      </button>

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
          {DEMO_QUIZ.map((question, qi) => (
            <QuizStep
              key={question.id}
              question={question}
              lang={lang}
              selected={answers[qi]}
              onAnswer={(optionIndex) =>
                setAnswers((prev) =>
                  prev.map((a, i) => (i === qi ? optionIndex : a)),
                )
              }
            />
          ))}
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
            · quiz {score}/{DEMO_QUIZ.length}
          </p>
          <div className="w-full rounded-2xl bg-accent-soft p-3 text-sm text-accent">
            Enregistré sur l&apos;appareil. La séance sera envoyée dès qu&apos;une
            connexion sera disponible.
          </div>
          <Button
            onClick={() => router.push("/")}
            className="font-display h-11 w-full font-bold"
          >
            Revenir à l&apos;accueil
          </Button>
        </div>
      )}
    </div>
  );
}
