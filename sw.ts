import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, CacheFirst, NetworkFirst, ExpirationPlugin } from "serwist";

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
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Documents HTML de navigation vers les routes (facilitator) : elles
      // sont server-rendered à la demande côté Next.js (params dynamiques
      // sous /modules/[id]) mais 100% client-only en pratique (CLAUDE.md
      // règle 1) — sans cette règle, le document HTML retombe sur le
      // NetworkFirst générique de `defaultCache` et échoue réseau coupé
      // même si le JS/CSS est précaché. Placée avant `defaultCache` pour
      // être évaluée en priorité (la première règle qui matche gagne).
      // "/" est exclu : c'est la landing publique (en ligne uniquement, hors
      // route group (facilitator)), elle ne doit jamais laisser croire à une
      // disponibilité offline qu'elle n'a pas — dégradation gracieuse via
      // `defaultCache` normale.
      matcher: ({ request, url }) =>
        request.mode === "navigate" &&
        url.pathname !== "/" &&
        !url.pathname.startsWith("/dashboard"),
      handler: new NetworkFirst({
        cacheName: "parentrelais-facilitator-pages",
        networkTimeoutSeconds: 3,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 32,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          }),
        ],
      }),
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
