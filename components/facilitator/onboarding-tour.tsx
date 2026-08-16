"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import "driver.js/dist/driver.css";
import { createTourDriver } from "@/lib/onboarding/create-tour-driver";
import { markOnboardingSeen } from "@/lib/db/meta";
import {
  useMarkOnboardingSeenMutation,
  useOnboardingSeenQuery,
} from "@/lib/hooks/use-onboarding-seen";

const FACILITATOR_TOUR_STEPS = [
  {
    element: "#module-list",
    popover: {
      title: "Modules de formation",
      description:
        "Retrouvez ici tous les modules disponibles, avec audio, vidéo et quiz.",
    },
  },
  {
    element: "#lang-pills",
    popover: {
      title: "Changer de langue",
      description: "Basculez entre les langues disponibles pour ce module.",
    },
  },
  {
    element: "#profile-button",
    popover: {
      title: "Votre profil",
      description:
        "Accédez à votre profil pour vous déconnecter ou réinitialiser le contenu.",
    },
  },
];

/**
 * Lance le tour indépendamment du flag "vu" — utilisé par le bouton
 * "Revoir le guide" du profil (via /home?tour=1, voir plus bas) et par tout
 * appelant qui veut relancer le guide explicitement.
 */
export function runFacilitatorTour(): void {
  createTourDriver({
    steps: FACILITATOR_TOUR_STEPS,
    onDone: () => {
      void markOnboardingSeen();
    },
  }).drive();
}

/**
 * Guide skippable au premier passage sur l'accueil facilitateur — ciblage
 * d'ancres réelles du DOM (module-list/lang-pills/profile-button, voir
 * app/(facilitator)/home/page.tsx). Monté seulement une fois les modules
 * chargés, pour que les ancres existent déjà quand driver.js tente de les
 * cibler. Se relance aussi manuellement via ?tour=1 dans l'URL (bouton
 * "Revoir le guide" du profil), indépendamment du flag "vu".
 */
export function FacilitatorOnboardingTour() {
  const { data: seen, isLoading } = useOnboardingSeenQuery();
  const markSeenMutation = useMarkOnboardingSeenMutation();
  const router = useRouter();

  useEffect(() => {
    // Lecture directe de l'URL plutôt que useSearchParams() : évite
    // d'imposer un Suspense boundary sur toute la zone facilitateur
    // (100% client, voir CLAUDE.md) pour un seul paramètre de replay.
    const replayRequested =
      new URLSearchParams(window.location.search).get("tour") === "1";

    if (replayRequested) {
      router.replace("/home");
      runFacilitatorTour();
      return;
    }

    if (isLoading || seen) return;

    const tourDriver = createTourDriver({
      steps: FACILITATOR_TOUR_STEPS,
      onDone: () => markSeenMutation.mutate(),
    });

    tourDriver.drive();

    return () => tourDriver.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, seen]);

  return null;
}
