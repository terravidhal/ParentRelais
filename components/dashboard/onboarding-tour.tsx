"use client";

import { useEffect } from "react";
import "driver.js/dist/driver.css";
import { createTourDriver } from "@/lib/onboarding/create-tour-driver";

const DASHBOARD_ONBOARDING_KEY = "parentrelais_dashboard_onboarding_seen";

const DASHBOARD_TOUR_STEPS = [
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
];

/**
 * Lance le tour indépendamment du flag "vu" — utilisé par le bouton
 * "Revoir le guide" du header du dashboard.
 */
export function runDashboardTour(): void {
  createTourDriver({
    steps: DASHBOARD_TOUR_STEPS,
    onDone: () => {
      window.localStorage.setItem(DASHBOARD_ONBOARDING_KEY, "true");
    },
  }).drive();
}

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

    const tourDriver = createTourDriver({
      steps: DASHBOARD_TOUR_STEPS,
      onDone: () => {
        window.localStorage.setItem(DASHBOARD_ONBOARDING_KEY, "true");
      },
    });

    tourDriver.drive();

    return () => tourDriver.destroy();
  }, []);

  return null;
}
