"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const DASHBOARD_ONBOARDING_KEY = "parentrelais_dashboard_onboarding_seen";

/**
 * Guide skippable au premier passage sur le dashboard — zone en ligne, donc
 * localStorage suffit (pas de contrainte offline comme côté facilitateur,
 * voir components/facilitator/onboarding-tour.tsx pour l'équivalent Dexie).
 * Monté depuis DashboardShell, après que la sidebar soit dans le DOM.
 */
export function DashboardOnboardingTour() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(DASHBOARD_ONBOARDING_KEY) === "true") return;

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
      onDestroyed: () => {
        window.localStorage.setItem(DASHBOARD_ONBOARDING_KEY, "true");
      },
      steps: [
        {
          element: "#nav-coverage",
          popover: {
            title: "Couverture",
            description: "Vue d'ensemble des familles touchées par le programme.",
          },
        },
        {
          element: "#nav-facilitators",
          popover: {
            title: "Facilitateurs",
            description: "Activité par facilitateur sur le terrain.",
          },
        },
        {
          element: "#nav-reports",
          popover: {
            title: "Rapports",
            description: "Exportez les séances enregistrées au format CSV.",
          },
        },
        {
          element: "#nav-content",
          popover: {
            title: "Contenus",
            description: "Gérez les modules et téléversez de nouveaux médias.",
          },
        },
      ],
    });

    tourDriver.drive();

    return () => tourDriver.destroy();
  }, []);

  return null;
}
