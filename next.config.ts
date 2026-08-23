import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  /* config options here */
};

/**
 * Documents HTML des routes (facilitator) à précacher explicitement au build.
 * @serwist/next ne scanne que les assets _next/static/* pour son manifest ;
 * les pages générées statiquement ne sont PAS ajoutées automatiquement.
 *
 * `/module` et `/module/session` sont des routes UNIQUES paramétrées par
 * `?id=` (voir app/(facilitator)/module/page.tsx). C'est ce qui rend cette
 * liste indépendante du catalogue : auparavant elle était dérivée du seed en
 * dur, une page par module, et un module créé après le déploiement n'aurait
 * eu aucune page précachée. Deux entrées suffisent désormais pour tous les
 * modules, présents et futurs (CLAUDE.md règle 1 — précache intégral).
 */
const facilitatorPageUrls = [
  "/home",
  "/login",
  "/history",
  "/profile",
  "/downloads",
  "/module",
  "/module/session",
];

const withSerwist = withSerwistInit({
  swSrc: "sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  // Les MÉDIAS (audio, sous-titres, vidéos) ne sont plus précachés au build.
  //
  // Ils vivent maintenant dans Supabase Storage, référencés par le contenu
  // servi à l'exécution : le build ne connaît plus leurs URL, et les figer
  // ici ramènerait le catalogue prisonnier d'une liste de build — exactement
  // ce que la route unique ci-dessus vient d'éliminer.
  //
  // Ils passent par le gestionnaire de téléchargement, où l'utilisateur
  // décide et suit la progression (lib/downloads/manager.ts). C'était déjà
  // le cas des vidéos : mesuré en production, leur précache obligatoire
  // bloquait le service worker 30 s en "installing" sur connexion rapide
  // (31 Mo avant activation), empêchant toute installation de la PWA.
  additionalPrecacheEntries: facilitatorPageUrls.map((url) => ({
    url,
    revision: null,
  })),
});

export default withSerwist(nextConfig);
