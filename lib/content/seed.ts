import type { CachedModule } from "@/lib/db/dexie";

/**
 * Contenu de démonstration en attendant le contenu réel fourni par
 * l'UNICEF/MINPROFF (voir docs/04-SCREENS.md). Repris du prototype de
 * référence ParentRelais_Demo.jsx.
 */
export const SEED_MODULES: CachedModule[] = [
  {
    id: 1,
    position: 1,
    duration_min: 45,
    translations: [
      {
        lang: "fr",
        title: "La perception de l'enfance",
        summary:
          "Comprendre l'enfant comme une personne à part entière, avec des besoins et des droits. Déconstruire l'idée que l'enfant se corrige par la punition.",
        key_points: [
          "Chaque enfant a des droits",
          "La violence éducative laisse des traces",
          "Écouter avant de corriger",
        ],
        audio_url: "/audio/module-1-fr.mp3",
        status: "ready",
      },
      {
        lang: "en",
        title: "How we see childhood",
        summary:
          "Understand the child as a full person with needs and rights. Move away from the idea that a child is corrected through punishment.",
        key_points: [
          "Every child has rights",
          "Harsh discipline leaves marks",
          "Listen before correcting",
        ],
        audio_url: "/audio/module-1-en.mp3",
        status: "ready",
      },
      {
        lang: "ff",
        title: "",
        summary: "",
        key_points: [],
        status: "pending",
      },
    ],
  },
  {
    id: 2,
    position: 2,
    duration_min: 50,
    translations: [
      {
        lang: "fr",
        title: "Développement de l'enfant",
        summary:
          "Les grandes étapes du développement de 0 à 6 ans et les pratiques parentales qui les soutiennent au quotidien.",
        key_points: [
          "Les 1000 premiers jours comptent",
          "Jouer, c'est apprendre",
          "Parler à l'enfant nourrit son cerveau",
        ],
        audio_url: "/audio/module-2-fr.mp3",
        status: "ready",
      },
      {
        lang: "en",
        title: "Child development",
        summary:
          "Key development stages from 0 to 6 years and the everyday parenting practices that support them.",
        key_points: [
          "The first 1000 days matter",
          "Play is learning",
          "Talking to a child feeds the brain",
        ],
        audio_url: "/audio/module-2-en.mp3",
        status: "ready",
      },
      {
        lang: "ff",
        title: "",
        summary: "",
        key_points: [],
        status: "pending",
      },
    ],
  },
];

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
