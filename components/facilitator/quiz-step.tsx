"use client";

import { CheckCircle2, Circle } from "lucide-react";
import type { QuizQuestion } from "@/lib/content/seed";

interface QuizStepProps {
  question: QuizQuestion;
  lang: string;
  selected: number | null;
  onAnswer: (optionIndex: number) => void;
}

export function QuizStep({ question, lang, selected, onAnswer }: QuizStepProps) {
  const translation =
    question.translations.find((t) => t.lang === lang) ??
    question.translations.find((t) => t.lang === "fr");

  if (!translation) return null;

  return (
    <div lang={translation.lang}>
      <p className="mb-2 text-sm font-semibold">{translation.question}</p>
      <div className="flex flex-col gap-2">
        {translation.options.map((option, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onAnswer(index)}
            className={`flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-left text-sm ${
              selected === index
                ? "bg-primary text-primary-foreground"
                : "bg-background text-foreground"
            }`}
          >
            {selected === index ? (
              <CheckCircle2 size={16} aria-hidden="true" />
            ) : (
              <Circle size={16} aria-hidden="true" />
            )}
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
