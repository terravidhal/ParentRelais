import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, CacheFirst, ExpirationPlugin } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Précache intégral : les routes (facilitator) sont 100% client components
 * sans fetch serveur (voir CLAUDE.md), donc éligibles à un précache complet
 * HTML+JS+CSS. Les routes (dashboard) ne sont volontairement PAS précachées
 * ici : elles nécessitent le réseau par design (server components + auth
 * Supabase), et le précaching manifest ci-dessous ne couvre que les assets
 * de build communs — ces routes retombent sur `defaultCache` (NetworkFirst).
 */
const RUNTIME_PAGES = "parentrelais-facilitator-pages";

/**
 * Retrouve un document précaché malgré l'en-tête `Vary` de Next.js.
 *
 * En production, Vercel renvoie `Vary: rsc, next-router-state-tree, …` sur
 * chaque page. Le Cache API respecte `Vary` : une navigation ordinaire
 * n'envoyant pas ces en-têtes, elle ne correspondait plus à l'entrée
 * précachée, et l'application installée échouait au lancement hors réseau
 * — « this page couldn't load », constaté sur téléphone.
 *
 * `ignoreVary: true` lève cette contrainte : le document HTML est le même
 * quels que soient ces en-têtes de routage.
 */
async function matchPrecachedDocument(
  pathname: string,
): Promise<Response | undefined> {
  const direct = await serwist.matchPrecache(pathname);
  if (direct) return direct;

  // Recherche élargie dans tous les caches, en ignorant Vary.
  const url = new URL(pathname, self.location.origin).href;
  return caches.match(url, { ignoreVary: true });
}

/** Abandonne une requête réseau au-delà du délai imparti. */
async function withTimeout(
  promise: Promise<Response>,
  ms: number,
): Promise<Response | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // skipWaiting: une nouvelle version du service worker s'active dès son
  // installation, sans attendre la fermeture des onglets ouverts. Conservé
  // à `true` : sur un téléphone de terrain que le facilitateur ne ferme
  // jamais vraiment, une mise à jour de contenu ne doit pas rester bloquée
  // indéfiniment derrière un onglet dormant.
  //
  // Le rechargement de page observé au retour du réseau pendant les tests
  // s'est révélé indépendant de ce réglage : il se produit aussi sur la
  // landing publique (hors zone facilitateur, sans aucun de nos hooks) et
  // avec skipWaiting à false. C'est un artefact de l'environnement de test,
  // pas un comportement de l'app à corriger ici.
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Routes de module : `/module?id=3` et `/module/session?id=3`.
      //
      // Le document précaché est enregistré sous `/module` NU, sans query
      // string. Or la query string fait partie de la clé de cache : une
      // navigation vers `/module?id=3` ne matche donc PAS l'entrée
      // précachée, et échouait réseau coupé (constaté : ERR_FAILED en test
      // hors-ligne) alors même que le document était bien en cache.
      //
      // On sert ici l'entrée précachée en ignorant le paramètre : c'est
      // exactement ce qui rend la route unique viable hors-ligne pour
      // n'importe quel module, y compris ceux créés après le déploiement.
      matcher: ({ request, url }) =>
        request.mode === "navigate" &&
        (url.pathname === "/module" || url.pathname === "/module/session"),
      handler: async ({ url }) => {
        const cached = await matchPrecachedDocument(url.pathname);
        if (cached) return cached;
        // Pas encore précaché (premier chargement) : on tente le réseau.
        return fetch(url.pathname);
      },
    },
    {
      // Documents HTML de navigation vers les routes (facilitator) : elles
      // sont 100% client-only (CLAUDE.md règle 1) — sans cette règle, le
      // document HTML retombe sur le
      // NetworkFirst générique de `defaultCache` et échoue réseau coupé
      // même si le JS/CSS est précaché. Placée avant `defaultCache` pour
      // être évaluée en priorité (la première règle qui matche gagne).
      // "/" est INCLUS : c'est le `start_url` du manifeste, donc l'écran
      // d'ouverture de l'application installée. L'exclure faisait démarrer
      // l'app sur une page indisponible hors réseau.
      matcher: ({ request, url }) =>
        request.mode === "navigate" && !url.pathname.startsWith("/dashboard"),
      handler: async ({ request, url }) => {
        // Réseau d'abord, avec un délai court : une page fraîche vaut mieux,
        // mais on ne fait pas attendre un facilitateur sur un réseau mourant.
        try {
          const network = await withTimeout(fetch(request), 3000);
          if (network && network.ok) {
            const cache = await caches.open(RUNTIME_PAGES);
            void cache.put(request, network.clone());
            return network;
          }
        } catch {
          // Hors-ligne : on bascule sur les caches ci-dessous.
        }

        const runtime = await caches.match(request, {
          cacheName: RUNTIME_PAGES,
          ignoreVary: true,
        });
        if (runtime) return runtime;

        const precached = await matchPrecachedDocument(url.pathname);
        if (precached) return precached;

        // Dernier recours : la page d'accueil, toujours précachée. Mieux vaut
        // l'écran d'ouverture qu'une erreur de navigateur.
        return (
          (await matchPrecachedDocument("/")) ??
          Response.error()
        );
      },
    },
    {
      matcher: ({ request }) =>
        request.destination === "audio" || request.destination === "video",
      handler: new CacheFirst({
        cacheName: "parentrelais-media",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 60,
            maxAgeSeconds: 60 * 60 * 24 * 90,
          }),
        ],
      }),
    },
    {
      matcher: ({ request }) => request.destination === "font",
      handler: new CacheFirst({
        cacheName: "parentrelais-fonts",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          }),
        ],
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
