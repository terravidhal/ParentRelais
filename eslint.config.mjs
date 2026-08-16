import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Service worker généré par Serwist au build.
    "public/sw.js",
    // Démo de référence (pas du code de production, voir docs/04-SCREENS.md) —
    // sert uniquement de source visuelle à réimplémenter proprement.
    "ParentRelais_Demo.jsx",
    // Projets de référence pour le design de la landing — jamais buildés ni
    // déployés, uniquement une source d'inspiration à réimplémenter (voir
    // components/landing/landing-page.tsx).
    "parentrelais-landing/**",
    "parentrelais-preview/**",
  ]),
]);

export default eslintConfig;
