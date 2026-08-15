# ParentRelais

> La boîte à outils numérique **hors-ligne** des facilitateurs de parentalité positive.
> Candidature au concours d'innovation UNICEF Cameroon × MINPROFF (dépôt avant le 25 août 2026).

ParentRelais n'est pas une énième application de parentalité pour les parents. C'est un outil
destiné aux **facilitateurs communautaires** du programme national : il leur donne, sur un simple
téléphone, tout le contenu de formation (y compris en **audio et en langues locales**), un carnet
de séance, et une **synchronisation automatique** vers un tableau de bord national dès qu'une
connexion est disponible. Objectif : **démultiplier** un programme qui fonctionne déjà mais touche
trop peu de familles, y compris dans les zones sans réseau.

## Le système en une image

```
        ┌─────────────────────────┐
        │  SUPABASE (Postgres)    │   base + auth + stockage médias
        └───────────┬─────────────┘
                    │  (synchro quand il y a du réseau)
        ┌───────────┴───────────────┐
        │                           │
 ┌──────▼───────────┐      ┌────────▼──────────────┐
 │ APP FACILITATEUR │      │ TABLEAU DE BORD        │
 │ PWA hors-ligne   │      │ UNICEF / MINPROFF      │
 │ (rendu client)   │      │ (rendu serveur, admin) │
 │ → saisit / anime │      │ → pilote / dépose      │
 └──────────────────┘      └───────────────────────┘
```

## Stack

- **Next.js** (App Router, TypeScript) — une seule app, deux zones (voir `docs/02-ARCHITECTURE.md`)
- **Supabase** — Postgres, Auth, Storage (audios/vidéos)
- **Dexie.js** (IndexedDB) — stockage local hors-ligne + file d'attente de synchro
- **Serwist** — service worker / PWA / préchargement pour le mode hors-ligne
- **Tailwind CSS** + **shadcn/ui** + **lucide-react**
- **TanStack Query** — gestion des requêtes réseau (dashboard) et des lectures/écritures Dexie (facilitateur)

## Documents (à lire dans l'ordre)

| Fichier | Contenu |
| --- | --- |
| `CLAUDE.md` | Instructions pour Claude Code : conventions, priorités, garde-fous, « definition of done » |
| `docs/01-CONTEXT.md` | Le problème, la solution, le concours et ses critères |
| `docs/02-ARCHITECTURE.md` | Stack, structure des dossiers, flux hors-ligne → synchro |
| `docs/03-DATA-MODEL.md` | Schéma Supabase, schéma local Dexie, logique de synchro |
| `docs/04-SCREENS.md` | Toutes les pages/routes, leur rôle, leurs états |
| `docs/05-DESIGN-SYSTEM.md` | Couleurs, typographie, accessibilité (terrain + handicap) |
| `docs/06-BUILD-PLAN.md` | Feuille de route par phases + checklist MVP pour la deadline |

## Démarrage rapide

```bash
pnpm install
cp .env.example .env.local   # renseigner les clés Supabase
pnpm dev
```

## Priorité immédiate

Un **prototype minimal** (1 module + audio, capture d'une séance hors-ligne, synchro, mini
tableau de bord) suffit pour la candidature. Le reste se construit pendant la phase pilote.
Voir `docs/06-BUILD-PLAN.md`.
