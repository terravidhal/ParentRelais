"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import {
  useMarkOnboardingSeenMutation,
  useOnboardingSeenQuery,
} from "@/lib/hooks/use-onboarding-seen";

/**
 * Guide skippable au premier passage sur l'accueil facilitateur — ciblage
 * d'ancres réelles du DOM (module-list/lang-pills/profile-button, voir
 * app/(facilitator)/page.tsx). Monté seulement une fois les modules chargés,
 * pour que les ancres existent déjà quand driver.js tente de les cibler.
 */
export function FacilitatorOnboardingTour() {
  const { data: seen, isLoading } = useOnboardingSeenQuery();
  const markSeenMutation = useMarkOnboardingSeenMutation();

  useEffect(() => {
    if (isLoading || seen) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const tourDriver = driver({
      showProgress: true,
      allowClose: true,
      overlayClickBehavior: "close",
      overlayOpacity: 0.5,
      animate: !prefersReducedMotion,
      nextBtnText: "Suivant",
      prevBtnText: "Précédent",
      doneBtnText: "Terminer",
      onDestroyed: () => markSeenMutation.mutate(),
      steps: [
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
            description:
              "Basculez entre les langues disponibles pour ce module.",
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
      ],
    });

    tourDriver.drive();

    return () => tourDriver.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, seen]);

  return null;
}
