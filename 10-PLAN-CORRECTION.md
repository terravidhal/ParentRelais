# 10 — Plan de correction (suite de l'audit 09)

**Source** : `09-AUDIT-UX-UI.md` (score 11/20).
**Objectif** : atteindre un rendu crédible pour le concours + une PWA réellement démontrable
sur téléphone.

**Règle de travail** : après chaque lot, vérification par captures Playwright réelles aux
4 breakpoints (1440 / 1024 / 768 / 390) + `tsc` + `lint` + suite E2E. Commit par lot, jamais un
gros commit fourre-tout. Aucun lot n'est « terminé » sans capture ouverte et inspectée.

**Contraintes non négociables** (`CLAUDE.md`) : zone facilitateur 100 % client/offline/Dexie ;
dashboard server components + Supabase ; cibles ≥44 px ; contraste AA ; audio-first ;
aucune PII bénéficiaire ; pas de route API maison.

---

## Lot 1 — Correctifs immédiats (P0-4, P0-3)

Effort minime, impact réel, aucun risque visuel.

### 1.1 — `/downloads` hors-ligne (P0-4)

- `next.config.ts` : ajouter `"/downloads"` au tableau `facilitatorPageUrls`.
- **Vérification** : rebuild, coupure réseau réelle, navigation sur `/downloads` → doit répondre 200.
- **Test de non-régression à ajouter** : étendre `tests/offline.spec.ts` pour couvrir **toutes** les
  routes facilitateur hors-ligne, pas seulement `/home` — c'est précisément l'absence de ce test
  qui a laissé le bug passer.

### 1.2 — Focus clavier visible (P0-3)

- `app/globals.css`, bloc `@layer base` : règle globale sur `:focus-visible`, même approche que
  celle déjà utilisée pour `cursor-pointer` (filet de sécurité global plutôt que 45 corrections).
- Utiliser le token `--ring` existant. Ne pas casser les `focus-visible` déjà présents dans
  `components/ui/*` (plus spécifiques, ils gagnent).
- **Vérification** : navigation clavier réelle (Tab) sur `/home`, `/profile`, dashboard, landing —
  capture avec focus visible sur au moins un bouton par zone.

**Commit 1** : « Corrige /downloads hors-ligne et rend le focus clavier visible partout »

---

## Lot 2 — Contraste WCAG AA (P0-2)

Critère noté au concours. Modification de tokens uniquement, pas de structure.

### 2.1 — Corriger les tokens défaillants

Dans `app/globals.css` (`:root` et `.dark`) :

| Token | Actuel | Cible | Raison |
|---|---|---|---|
| `--accent` | `L 0.730` | ~`L 0.58` | 2.16–2.45 → ≥4.5 sur fonds clairs |
| `--muted-foreground` | `L 0.569` | ~`L 0.50` | 3.90–4.44 → ≥4.5 |
| `--destructive-soft` | `L 0.939` | éclaircir | 4.31 → ≥4.5 (bandeau hors-ligne) |
| `--brand-accent` | `L 0.720` | ~`L 0.55` | 2.40 → ≥4.5 (titre login admin) |

**Attention** : `--accent` sert à la fois de fond plein (`bg-accent` avec
`accent-foreground` dessus, ratio 6.54 actuellement OK) et de couleur de texte. Assombrir le token
unique casserait le fond plein. **Décision** : introduire `--accent-ink` dédié au texte sur fond
clair, et laisser `--accent` pour les fonds. Même logique si nécessaire pour `brand-accent`.

### 2.2 — Répercuter dans le code

Remplacer `text-accent` par `text-accent-ink` là où le texte est sur fond clair
(kickers, badges, libellés « à venir », bandeau téléchargement, icônes de section).

### 2.3 — Re-vérifier

Rejouer le calcul WCAG sur toutes les paires : **zéro échec AA corps** attendu sur les paires
de texte. Documenter les ratios obtenus dans `09-AUDIT-UX-UI.md`.

**Commit 2** : « Contraste AA sur tous les tokens de texte »

---

## Lot 3 — PWA complète (P1-1)

À faire **avant** toute démonstration sur téléphone réel.

### 3.1 — `app/layout.tsx`

- `metadata.appleWebApp` : `{ capable: true, statusBarStyle: "default", title: "ParentRelais" }`.
- `viewport` : ajouter `viewportFit: "cover"` (contenu sous l'encoche iPhone).
- Prévoir les `env(safe-area-inset-*)` sur le header sticky facilitateur et la sidebar dashboard
  si le test réel montre un chevauchement.

### 3.2 — `public/manifest.webmanifest`

- `start_url` : `/` → **`/home`** (l'app installée doit ouvrir l'app, pas la vitrine).
  Vérifier le comportement quand la session facilitateur est absente (doit rediriger vers `/login`).
- Ajouter `scope: "/"`, `orientation: "portrait"`, `categories: ["education", "productivity"]`.
- Ajouter `shortcuts` : « Animer une séance » → `/home`, « Mes séances » → `/history`,
  « Téléchargements » → `/downloads`.
- Ajouter `screenshots` (requis pour l'UI d'installation riche Android) : captures réelles
  390×844 (`form_factor: "narrow"`) et 1440×900 (`form_factor: "wide"`), générées par Playwright
  et rangées dans `public/screenshots/`.

### 3.3 — Vérification

- Diagnostic navigateur : tous les champs manquants du tableau P1-1 doivent passer à OK.
- Test hors-ligne sur **les 7 routes** facilitateur.
- **Test manuel requis de ta part** : installation réelle sur un téléphone Android et/ou iOS,
  vérification de l'icône, du splash, du mode standalone et du fonctionnement avion.

**Commit 3** : « PWA complète : iOS, start_url, shortcuts, screenshots »

---

## Lot 4 — Rendu premium desktop / tablette (P0-1 + « Ce qui manque »)

Le chantier de fond. C'est ici que se joue le ressenti « site premium ».

### 4.0 — Préalable : direction visuelle

Avant de coder, poser explicitement :
- une **échelle d'élévation** (surface de fond / carte / élément flottant) — aujourd'hui tout est
  plat, bordure 1 px + blanc ;
- un **rythme d'espacement varié** (aujourd'hui `p-4`/`gap-4` uniforme partout) ;
- des **largeurs par type de contenu** au lieu d'un `max-w-xl` unique :
  lecture média ~720 px, listes ~900 px, flux d'étapes ~640 px, tableaux pleine largeur.

Rechercher des références réelles (dashboards produits reconnus) avant d'implémenter, plutôt que
de produire un gabarit générique.

### 4.1 — Zone facilitateur

Par page, remplacer le `lg:max-w-xl` unique par une composition adaptée :

| Page | Traitement |
|---|---|
| `/profile` | 2 colonnes desktop : identité + réglages / infos & actions |
| `/history` | Liste enrichie pleine largeur + résumé latéral (stats locales déjà chargées) |
| `/downloads` | Liste + panneau d'état global (total, en cours, terminés) |
| `/modules/[id]` | Média large + guide d'animation en colonne latérale |
| `/modules/[id]/session` | Flux centré ~640 px **conservé** (formulaire), mais contexte autour |
| `/home` | Déjà à 72 %, affiner le rythme et l'élévation |

### 4.2 — Dashboard

Déjà à 77–78 %. Travailler la **profondeur** et la **densité composée** plutôt que la largeur :
élévation des cartes, hiérarchie typographique, états vides qui enseignent.

### 4.3 — États hover manquants (P1-5)

25 boutons sur 12 fichiers. À traiter dans le même passage, zone par zone, pour cohérence.

### 4.4 — Vérification

Captures aux 4 breakpoints sur **toutes** les pages. Cible : `usedPct` ≥ 70 % en 1440 px sur
toutes les pages facilitateur (contre 40 % aujourd'hui), sans jamais étirer un formulaire
au-delà de sa largeur lisible.

**Commit 4** (probablement plusieurs) : un commit par zone (facilitateur, dashboard).

---

## Lot 5 — Landing (P1-2, P1-4)

### 5.1 — Débordement à 1024 px (P1-2)

Badge « 01 — outil pensé pour les réalités » sort de 41 px. Corriger la marge négative
`lg:-mr-20` non compensée à cette largeur. Vérifier les 7 éléments listés dans l'audit.

### 5.2 — Tokeniser les couleurs (P1-4)

135 hex en dur dans `landing-page.tsx` → tokens du design system. Prérequis pour que le lot 6
(mode sombre) puisse s'y appliquer, et pour que tout ajustement de palette se propage.

**Commit 5** : « Landing : corrige le débordement 1024px et tokenise les couleurs »

---

## Lot 6 — Décisions à trancher (P1-3, P2)

### 6.1 — Mode sombre (P1-3) — **décision requise avant de coder**

~40 tokens `.dark` définis, jamais activables. Deux options :
- **A** : brancher `next-themes` + bascule + auditer le contraste en sombre (travail réel).
- **B** : retirer les tokens morts (honnête, réduit la dette).

Ne pas laisser en l'état.

### 6.2 — Eyebrow systématique (P2-1)

« PILOTAGE NATIONAL » sur chaque page du dashboard → garder un kicker délibéré à un seul endroit,
ou le supprimer.

### 6.3 — Typographie (P2-2)

Évaluer une famille unique sur les surfaces produit (dashboard/facilitateur), en gardant le
pairing sur la landing. À trancher visuellement, pas dogmatiquement.

### 6.4 — Cibles tactiles < 44 px (P2-3)

2 sur `/home` et `/modules/[id]`, 5 sur la landing, 1 sur le dashboard. Identifier et corriger.

**Commit 6** : selon les décisions retenues.

---

## Vérification finale (avant de considérer l'ensemble livré)

1. `pnpm tsc --noEmit`, `pnpm lint` — zéro erreur.
2. `pnpm test` — unitaires verts.
3. `pnpm build` — toutes les routes compilent.
4. `pnpm test:e2e` — 22 tests + les nouveaux tests hors-ligne verts.
5. Captures 4 breakpoints × toutes les pages, **ouvertes et inspectées**.
6. Re-calcul WCAG : zéro échec AA corps.
7. Diagnostic PWA : tous les champs OK.
8. **Test manuel sur téléphone réel** (à ta charge) : installation, mode avion, icône, splash.
9. Mettre à jour le score dans `09-AUDIT-UX-UI.md`.

---

## Suivi

| Lot | État | Commit |
|---|---|---|
| 1 — Correctifs immédiats | **fait** | `60c7433` |
| 2 — Contraste AA | **fait** | (ce commit) |
| 3 — PWA complète | en cours | — |
| 4 — Premium desktop/tablette | à faire | — |
| 5 — Landing | à faire | — |
| 6 — Décisions | à faire | — |
