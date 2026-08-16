import type { CachedModule } from "@/lib/db/dexie";

/**
 * Contenu de démonstration en attendant le contenu réel fourni par
 * l'UNICEF/MINPROFF (voir docs/04-SCREENS.md). Repris du prototype de
 * référence ParentRelais_Demo.jsx.
 *
 * Médias : un seul jeu de fichiers réels (audio_url/video_url/subtitles_url)
 * est réutilisé sur tous les modules et langues — répétition assumée pour
 * que le jury voie le mécanisme fonctionner partout plutôt qu'un module
 * visiblement vide. À remplacer par le contenu réel sans changement de code
 * (voir 03-DATA-MODEL.md : "ajouter une langue = insérer des lignes").
 */
const DEMO_AUDIO_URL = "/audio/module-1-en.mp3";
const DEMO_VIDEO_URL = "/video/module-1.mp4";
const DEMO_SUBTITLES_URL = "/video/module-1-fr.vtt";

/**
 * Incrémenter à chaque changement de contenu de SEED_MODULES — c'est ce qui
 * déclenche le resync automatique côté Dexie (voir lib/db/seedDb.ts) pour que
 * les appareils déjà seedés reçoivent la mise à jour sans action manuelle.
 */
export const SEED_VERSION = 2;

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
        audio_url: DEMO_AUDIO_URL,
        video_url: DEMO_VIDEO_URL,
        subtitles_url: DEMO_SUBTITLES_URL,
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
        audio_url: DEMO_AUDIO_URL,
        video_url: DEMO_VIDEO_URL,
        subtitles_url: DEMO_SUBTITLES_URL,
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
        audio_url: DEMO_AUDIO_URL,
        video_url: DEMO_VIDEO_URL,
        subtitles_url: DEMO_SUBTITLES_URL,
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
        audio_url: DEMO_AUDIO_URL,
        video_url: DEMO_VIDEO_URL,
        subtitles_url: DEMO_SUBTITLES_URL,
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
    id: 3,
    position: 3,
    duration_min: 40,
    translations: [
      {
        lang: "fr",
        title: "La communication bienveillante",
        summary:
          "Comment parler à un enfant pour être compris sans crier ni menacer. Des mots simples qui renforcent la confiance plutôt que la peur.",
        key_points: [
          "Se mettre à hauteur d'enfant",
          "Nommer ce que l'on ressent",
          "Poser des limites sans humilier",
        ],
        audio_url: DEMO_AUDIO_URL,
        video_url: DEMO_VIDEO_URL,
        subtitles_url: DEMO_SUBTITLES_URL,
        status: "ready",
      },
      {
        lang: "en",
        title: "Positive communication",
        summary:
          "How to talk to a child so they understand, without shouting or threats. Simple words that build trust instead of fear.",
        key_points: [
          "Get down to the child's level",
          "Name what you feel",
          "Set limits without humiliating",
        ],
        audio_url: DEMO_AUDIO_URL,
        video_url: DEMO_VIDEO_URL,
        subtitles_url: DEMO_SUBTITLES_URL,
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
    id: 4,
    position: 4,
    duration_min: 45,
    translations: [
      {
        lang: "fr",
        title: "La gestion des émotions de l'enfant",
        summary:
          "Les colères et les pleurs ne sont pas des caprices mais des émotions à accompagner. Des gestes simples pour aider l'enfant à se calmer.",
        key_points: [
          "Une colère se traverse, ne se punit pas",
          "Rester calme aide l'enfant à se calmer",
          "Nommer l'émotion avant de la corriger",
        ],
        audio_url: DEMO_AUDIO_URL,
        video_url: DEMO_VIDEO_URL,
        subtitles_url: DEMO_SUBTITLES_URL,
        status: "ready",
      },
      {
        lang: "en",
        title: "Managing a child's emotions",
        summary:
          "Tantrums and tears are not manipulation but emotions to support. Simple gestures to help a child calm down.",
        key_points: [
          "Anger should be accompanied, not punished",
          "Staying calm helps the child calm down",
          "Name the emotion before correcting it",
        ],
        audio_url: DEMO_AUDIO_URL,
        video_url: DEMO_VIDEO_URL,
        subtitles_url: DEMO_SUBTITLES_URL,
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
    id: 5,
    position: 5,
    duration_min: 50,
    translations: [
      {
        lang: "fr",
        title: "Nutrition et croissance",
        summary:
          "Ce qu'un enfant doit manger selon son âge pour bien grandir, avec des solutions accessibles aux familles à revenu modeste.",
        key_points: [
          "La diversité alimentaire compte plus que la quantité",
          "L'allaitement protège jusqu'à 2 ans",
          "Surveiller la croissance repère tôt les problèmes",
        ],
        audio_url: DEMO_AUDIO_URL,
        video_url: DEMO_VIDEO_URL,
        subtitles_url: DEMO_SUBTITLES_URL,
        status: "ready",
      },
      {
        lang: "en",
        title: "Nutrition and growth",
        summary:
          "What a child needs to eat at each age to grow well, with solutions accessible to lower-income families.",
        key_points: [
          "Food diversity matters more than quantity",
          "Breastfeeding protects up to age 2",
          "Growth monitoring catches problems early",
        ],
        audio_url: DEMO_AUDIO_URL,
        video_url: DEMO_VIDEO_URL,
        subtitles_url: DEMO_SUBTITLES_URL,
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
    id: 6,
    position: 6,
    duration_min: 35,
    translations: [
      {
        lang: "fr",
        title: "Santé et hygiène au quotidien",
        summary:
          "Des gestes simples et peu coûteux qui évitent la plupart des maladies infantiles courantes dans les foyers.",
        key_points: [
          "Se laver les mains aux moments clés",
          "L'eau propre avant tout",
          "Reconnaître les signes qui doivent alerter",
        ],
        audio_url: DEMO_AUDIO_URL,
        video_url: DEMO_VIDEO_URL,
        subtitles_url: DEMO_SUBTITLES_URL,
        status: "ready",
      },
      {
        lang: "en",
        title: "Everyday health and hygiene",
        summary:
          "Simple, low-cost habits that prevent most common childhood illnesses at home.",
        key_points: [
          "Wash hands at key moments",
          "Clean water comes first",
          "Recognize warning signs early",
        ],
        audio_url: DEMO_AUDIO_URL,
        video_url: DEMO_VIDEO_URL,
        subtitles_url: DEMO_SUBTITLES_URL,
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
    id: 7,
    position: 7,
    duration_min: 45,
    translations: [
      {
        lang: "fr",
        title: "Protection contre la violence",
        summary:
          "Reconnaître les signes de violence envers un enfant et savoir vers qui se tourner dans sa communauté pour le protéger.",
        key_points: [
          "La violence n'éduque jamais, elle blesse",
          "Un enfant protégé sait qui alerter",
          "Le silence de l'entourage aggrave le risque",
        ],
        audio_url: DEMO_AUDIO_URL,
        video_url: DEMO_VIDEO_URL,
        subtitles_url: DEMO_SUBTITLES_URL,
        status: "ready",
      },
      {
        lang: "en",
        title: "Protection against violence",
        summary:
          "Recognizing signs of violence against a child and knowing who to turn to in the community to protect them.",
        key_points: [
          "Violence never educates, it harms",
          "A protected child knows who to tell",
          "Silence from those around increases the risk",
        ],
        audio_url: DEMO_AUDIO_URL,
        video_url: DEMO_VIDEO_URL,
        subtitles_url: DEMO_SUBTITLES_URL,
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
    id: 8,
    position: 8,
    duration_min: 40,
    translations: [
      {
        lang: "fr",
        title: "Le jeu comme apprentissage",
        summary:
          "Jouer n'est pas une perte de temps : c'est ainsi que l'enfant développe son langage, sa motricité et sa confiance en lui.",
        key_points: [
          "Pas besoin de jouets achetés pour bien jouer",
          "Le jeu partagé renforce le lien parent-enfant",
          "Chaque âge a ses jeux naturels",
        ],
        audio_url: DEMO_AUDIO_URL,
        video_url: DEMO_VIDEO_URL,
        subtitles_url: DEMO_SUBTITLES_URL,
        status: "ready",
      },
      {
        lang: "en",
        title: "Play as learning",
        summary:
          "Play is not wasted time: it is how a child develops language, motor skills, and self-confidence.",
        key_points: [
          "No bought toys are needed to play well",
          "Shared play strengthens the parent-child bond",
          "Every age has its natural games",
        ],
        audio_url: DEMO_AUDIO_URL,
        video_url: DEMO_VIDEO_URL,
        subtitles_url: DEMO_SUBTITLES_URL,
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
