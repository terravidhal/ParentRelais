import { driver, type Config, type PopoverDOM } from "driver.js";

interface CreateTourDriverOptions {
  steps: Config["steps"];
  onDone: () => void;
}

/**
 * Config driver.js partagée entre le tour facilitateur (Dexie) et le tour
 * dashboard admin (localStorage) — mêmes options visuelles/textes, seul le
 * stockage du flag "vu" diffère entre les deux appelants (voir onDone).
 * Injecte un bouton "Passer" explicite (driver.js n'en a pas nativement,
 * seulement une croix de fermeture peu visible) via onPopoverRender.
 */
export function createTourDriver({ steps, onDone }: CreateTourDriverOptions) {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  return driver({
    showProgress: true,
    allowClose: true,
    overlayClickBehavior: "close",
    overlayOpacity: 0.5,
    animate: !prefersReducedMotion,
    nextBtnText: "Suivant",
    prevBtnText: "Précédent",
    doneBtnText: "Terminer",
    onDestroyed: onDone,
    onPopoverRender: (popover: PopoverDOM, { driver: tourDriver }) => {
      const skipBtn = document.createElement("button");
      skipBtn.type = "button";
      skipBtn.textContent = "Passer le guide";
      skipBtn.className =
        "driver-popover-skip-btn font-display text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline";
      skipBtn.style.cssText =
        "margin-right:auto;padding:0.5rem 0;cursor:pointer;background:none;border:none;";
      skipBtn.addEventListener("click", () => tourDriver.destroy());
      popover.footerButtons.prepend(skipBtn);
    },
    steps,
  });
}
