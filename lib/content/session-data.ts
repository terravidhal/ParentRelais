/**
 * Données du déroulé de séance — distinctes du CATALOGUE de modules, qui
 * vient désormais de Supabase (lib/content/fetch-content.ts).
 *
 * Elles restent dans le code pour l'instant : le quiz n'a pas encore de
 * table dédiée, et la liste des localités sert de suggestion de saisie, pas
 * de référentiel. À faire descendre du serveur quand le contenu réel
 * UNICEF/MINPROFF arrivera, sur le même mécanisme que les modules.
 */

export const VILLAGES = ["Maroua", "Mokolo", "Kousséri", "Mora"] as const;

export interface QuizQuestion {
  id: number;
  translations: {
    lang: string;
    question: string;
    options: string[];
  }[];
  correct: number;
}

export const DEMO_QUIZ: QuizQuestion[] = [
  {
    id: 1,
    correct: 1,
    translations: [
      {
        lang: "fr",
        question: "Que faire quand un enfant fait une bêtise ?",
        options: [
          "Le frapper pour qu'il retienne",
          "Comprendre et expliquer calmement",
          "L'ignorer complètement",
        ],
      },
      {
        lang: "en",
        question: "What to do when a child misbehaves?",
        options: [
          "Hit him so he remembers",
          "Understand and explain calmly",
          "Ignore him completely",
        ],
      },
    ],
  },
  {
    id: 2,
    correct: 1,
    translations: [
      {
        lang: "fr",
        question: "Les 1000 premiers jours de l'enfant sont…",
        options: [
          "Sans importance",
          "Décisifs pour son cerveau",
          "Réservés à la mère seule",
        ],
      },
      {
        lang: "en",
        question: "A child's first 1000 days are…",
        options: ["Not important", "Decisive for the brain", "For the mother only"],
      },
    ],
  },
];
