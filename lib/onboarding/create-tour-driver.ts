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
    // "1 of 3" par défaut : driver.js n'est pas traduit, et le libellé se
    // collait au bouton "Passer" faute d'espacement dans le footer.
    progressText: "Étape {{current}} sur {{total}}",
    onDestroyed: onDone,
    onPopoverRender: (popover: PopoverDOM, { driver: tourDriver }) => {
      // Bouton "Passer" explicite : la croix de fermeture de driver.js est
      // trop discrète pour un facilitateur peu à l'aise avec le numérique,
      // et tant que le guide est actif, driver.js pose
      // `.driver-active * { pointer-events: none }` — tous les autres clics
      // de la page sont bloqués. Sans porte de sortie évidente, l'app paraît
      // figée (constaté en test réel sur téléphone).
      const skipBtn = document.createElement("button");
      skipBtn.type = "button";
      skipBtn.textContent = "Passer";
      skipBtn.setAttribute("aria-label", "Passer le guide");
      skipBtn.className = "driver-popover-skip-btn";
      skipBtn.addEventListener("click", () => tourDriver.destroy());
      popover.footerButtons.prepend(skipBtn);
    },
    steps,
  });
}
