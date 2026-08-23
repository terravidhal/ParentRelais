"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import "driver.js/dist/driver.css";
import { createTourDriver } from "@/lib/onboarding/create-tour-driver";

const DASHBOARD_ONBOARDING_KEY = "parentrelais_dashboard_onboarding_seen";
/** Reprise du tour après une navigation : l'étape à jouer au prochain montage. */
const RESUME_KEY = "parentrelais_dashboard_tour_resume";

type Router = ReturnType<typeof useRouter>;

/**
 * Étapes du guide, groupées par page.
 *
 * L'ancienne version se contentait de pointer les quatre entrées de menu
 * avec une phrase chacune : elle ne montrait rien de ce que font réellement
 * les pages. Ici le guide NAVIGUE — il ouvre chaque page et commente ce
 * qu'on y voit, ce qui en fait une véritable visite guidée pour un jury ou
 * un coordinateur qui découvre l'outil.
 */
const TOUR_PAGES = [
  {
    route: "/dashboard",
    steps: [
      {
        element: "#tour-kpis",
        popover: {
          title: "Les chiffres clés du programme",
          description:
            "Familles touchées, séances animées, part de personnes en situation de handicap. Ces totaux viennent des séances remontées par les facilitateurs depuis le terrain.",
        },
      },
      {
        element: "#tour-localites",
        popover: {
          title: "Répartition par localité",
          description:
            "Où le programme touche le plus de familles. Utile pour repérer les zones encore peu couvertes.",
        },
      },
      {
        element: "#tour-facilitateurs-actifs",
        popover: {
          title: "Qui anime en ce moment",
          description:
            "Les facilitateurs ayant synchronisé récemment. Cliquez sur un nom pour voir le détail de ses séances.",
        },
      },
    ],
  },
  {
    route: "/dashboard/facilitators",
    steps: [
      {
        element: "#tour-table-facilitateurs",
        popover: {
          title: "L'activité de chaque facilitateur",
          description:
            "Séances animées et familles touchées, par région. Chaque ligne mène à l'historique détaillé de la personne.",
        },
      },
    ],
  },
  {
    route: "/dashboard/reports",
    steps: [
      {
        element: "#tour-export",
        popover: {
          title: "Exporter pour vos bilans",
          description:
            "Toutes les séances synchronisées, au format CSV — prêtes pour les rapports UNICEF/MINPROFF.",
        },
      },
    ],
  },
  {
    route: "/dashboard/content",
    steps: [
      {
        element: "#tour-matrice",
        popover: {
          title: "Ajouter une langue, c'est remplir une case",
          description:
            "Chaque case croise un module et une langue. Déposer un fichier suffit à la rendre disponible dans l'app facilitateur — sans toucher au code.",
        },
      },
    ],
  },
] as const;

/**
 * Attend que l'ancre de la première étape soit peinte avant de lancer le
 * guide. Un délai fixe ne suffit pas : les pages qui chargent une longue
 * liste depuis Supabase peignent plus tard, et driver.js sautait alors
 * l'étape faute de cible (constaté : la page Facilitateurs était omise).
 */
function whenAnchorReady(selector: string, run: () => void): () => void {
  let cancelled = false;
  const deadline = Date.now() + 4000;

  const attempt = () => {
    if (cancelled) return;
    if (document.querySelector(selector)) {
      run();
      return;
    }
    if (Date.now() > deadline) return; // on abandonne sans bloquer le guide
    window.requestAnimationFrame(attempt);
  };
  attempt();

  return () => {
    cancelled = true;
  };
}

function markSeen() {
  window.localStorage.setItem(DASHBOARD_ONBOARDING_KEY, "true");
  window.sessionStorage.removeItem(RESUME_KEY);
}

/**
 * Joue les étapes de la page courante, puis enchaîne sur la suivante.
 *
 * driver.js ne survit pas à une navigation Next : on mémorise l'index de la
 * page à reprendre en sessionStorage, et le composant relance le guide au
 * montage de la page d'arrivée (voir DashboardOnboardingTour).
 */
function runPage(pageIndex: number, router: Router) {
  const page = TOUR_PAGES[pageIndex];
  if (!page) return;

  const isLastPage = pageIndex === TOUR_PAGES.length - 1;

  const tourDriver = createTourDriver({
    steps: page.steps.map((s) => ({ ...s })),
    // Fin des étapes de CETTE page : on note la page suivante à reprendre,
    // puis on y navigue. `onFinished` ne se déclenche qu'au clic sur
    // « Terminer », jamais sur un abandon — c'est ce qui distingue « j'ai
    // fini cette page » de « je quitte le guide ».
    onFinished: isLastPage
      ? undefined
      : () => {
          window.sessionStorage.setItem(RESUME_KEY, String(pageIndex + 1));
          router.push(TOUR_PAGES[pageIndex + 1].route);
        },
    onDone: () => {
      // Déclenché aussi bien à la fin qu'à un abandon. Si aucune reprise
      // n'est en attente, le guide est réellement terminé.
      if (window.sessionStorage.getItem(RESUME_KEY) === null) {
        markSeen();
      }
    },
  });

  tourDriver.drive();
}

/** Lance le guide depuis le début, quel que soit le flag « déjà vu ». */
export function runDashboardTour(router: Router, pathname: string): void {
  window.sessionStorage.removeItem(RESUME_KEY);
  if (pathname !== TOUR_PAGES[0].route) {
    // Le guide commence sur Couverture : on s'y rend, la reprise fera le reste.
    window.sessionStorage.setItem(RESUME_KEY, "0");
    router.push(TOUR_PAGES[0].route);
    return;
  }
  runPage(0, router);
}

/**
 * Monté depuis DashboardShell. Déclenche le guide au premier passage, et
 * reprend le parcours après chaque navigation qu'il a lui-même provoquée.
 */
export function DashboardOnboardingTour() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Reprise après navigation : prioritaire sur le déclenchement initial.
    const pending = window.sessionStorage.getItem(RESUME_KEY);
    if (pending !== null) {
      const index = Number(pending);
      if (TOUR_PAGES[index]?.route === pathname) {
        window.sessionStorage.removeItem(RESUME_KEY);
        const first = TOUR_PAGES[index].steps[0].element;
        return whenAnchorReady(first, () => runPage(index, router));
      }
      return;
    }

    if (window.localStorage.getItem(DASHBOARD_ONBOARDING_KEY) === "true") return;
    if (pathname !== TOUR_PAGES[0].route) return;

    return whenAnchorReady(TOUR_PAGES[0].steps[0].element, () =>
      runPage(0, router),
    );
  }, [pathname, router]);

  return null;
}
