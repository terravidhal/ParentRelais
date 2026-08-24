# ParentRelais

> La boîte à outils numérique **hors-ligne** des facilitateurs de parentalité positive.
> Candidature au concours d'innovation UNICEF Cameroon × MINPROFF.

**Application en ligne : [parent-relais.vercel.app](https://parent-relais.vercel.app)**

ParentRelais n'est pas une application de parentalité pour les parents. C'est un outil destiné aux
**facilitateurs communautaires** du programme national : il leur donne, sur un simple téléphone,
tout le contenu de formation (y compris en **audio et en langues locales**), un carnet de séance,
et une **synchronisation automatique** vers un tableau de bord national dès qu'une connexion
revient.

---

## ⚡ Tester en 2 minutes (sans rien installer)

Rendez-vous sur **[parent-relais.vercel.app](https://parent-relais.vercel.app)**. Les identifiants
sont affichés directement sur la page d'accueil, et les formulaires se pré-remplissent en un clic.

### Comptes de démonstration

| Espace | Identifiants |
| --- | --- |
| **Facilitateur** (terrain) | `facilitateur.demo@parentrelais.app` · `DemoTerrain2026!` · code PIN `1234` |
| **Pilotage** (UNICEF/MINPROFF) | `demo@parentrelais.app` · `ParentRelais2026!` |

> Le code PIN est pré-rempli. Il sert à rouvrir l'application **sans réseau** : c'est votre
> identité locale sur l'appareil, pas un mot de passe serveur.

### Le parcours qui montre la valeur du produit

Le cœur de ParentRelais est le **mode hors-ligne**. Pour le voir, il faut suivre ces trois étapes
dans l'ordre :

**1. Installez l'application** — Espace facilitateur → Profil → « Installer l'application ».
Sur Android/Chrome, une fenêtre de confirmation apparaît. Sur iPhone/Safari : Partager → « Sur
l'écran d'accueil ».

> ⚠️ **L'installation n'est pas optionnelle.** Sans elle, le navigateur peut perdre l'accès à
> l'application hors connexion. C'est la contrainte réelle du terrain : le facilitateur s'équipe
> en zone couverte, puis part travailler là où il n'y a pas de réseau.

**2. Téléchargez les médias** — Accueil → « Téléchargements ». Chaque module indique s'il est
disponible hors-ligne. Les vidéos ne se téléchargent pas automatiquement : c'est un choix
délibéré, pour ne pas consommer le forfait du facilitateur à son insu.

**3. Coupez le réseau** (mode avion) et rouvrez l'application. Tout continue de fonctionner :

- consulter un module, écouter son audio, regarder sa vidéo ;
- animer une séance complète (présences, quiz, enregistrement) ;
- consulter l'historique des séances.

**4. Rétablissez le réseau.** La séance remonte automatiquement, et apparaît dans l'espace de
pilotage (Couverture, Rapports).

### Ce qu'il y a à voir dans l'espace de pilotage

- **Couverture** — familles touchées par localité, activité des facilitateurs.
- **Contenus** — la matrice module × langue. Déposer un fichier suffit à rendre un contenu
  disponible sur le terrain, sans toucher au code.
- **Référentiel** — ajouter une langue, une région ou une localité. C'est ce qui rend vraie la
  promesse « ajouter une langue = remplir une case ».
- **Rapports** — export CSV des séances pour les bilans.

---

## 🛠 Installer le projet en local

### Prérequis

- **Node.js 20+** et **pnpm** (`npm install -g pnpm`)
- Un projet **Supabase** (gratuit) — [supabase.com](https://supabase.com)

### 1. Dépendances

```bash
git clone https://github.com/terravidhal/ParentRelais.git
cd ParentRelais
pnpm install
```

### 2. Variables d'environnement

```bash
cp .env.example .env.local
```

Renseignez `.env.local` depuis votre projet Supabase (**Settings → API Keys**) :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...        # clé « anon » ou « publishable »
SUPABASE_SECRET_KEY=sb_secret_...           # clé « secret » (ou service_role)
```

> `SUPABASE_SECRET_KEY` ne sert **que côté serveur** (création de comptes facilitateurs). Elle n'a
> volontairement pas le préfixe `NEXT_PUBLIC_` : Next.js n'expose au navigateur que les variables
> ainsi préfixées, ce qui rend une fuite impossible par construction.

### 3. Base de données

Dans Supabase → **SQL Editor**, exécutez les fichiers de `supabase/migrations/` **dans l'ordre
numérique**, de `0001` à `0022`. Chacun est idempotent : les rejouer ne duplique rien.

Les migrations créent le schéma, les politiques de sécurité (RLS), et un contenu de démonstration
(8 modules, leurs quiz, les langues et régions).

### 4. Créer un compte administrateur

Supabase → **Authentication → Users → Add user** (cochez « Auto Confirm User »), puis dans le SQL
Editor :

```sql
insert into public.profiles (id, full_name, role, region)
values ('<UUID-de-l-utilisateur>', 'Votre nom', 'admin', 'Extrême-Nord')
on conflict (id) do update set role = 'admin';
```

Les comptes **facilitateurs** se créent ensuite depuis l'interface : Espace de pilotage →
Facilitateurs → « Nouveau facilitateur ».

### 5. Lancer

```bash
pnpm dev          # http://localhost:3000
```

```bash
pnpm build        # build de production
pnpm test         # tests unitaires (Vitest)
pnpm test:e2e     # tests bout-en-bout (Playwright)
```

> Le mode hors-ligne ne fonctionne **pas** en `pnpm dev` : le service worker y est désactivé pour
> ne pas gêner le rechargement à chaud. Pour le tester en local, faites `pnpm build && pnpm start`.

---

## 🧭 Comment c'est construit

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

**Deux zones, deux contraintes opposées, une seule application Next.js :**

- `app/(facilitator)` — 100 % composants client, précachés par le service worker. Aucune de ces
  routes ne dépend d'un appel serveur au chargement. Données locales via **Dexie/IndexedDB**.
- `app/(dashboard)` — composants serveur + authentification Supabase. En ligne par nature.

### Choix structurants

**La synchronisation ne perd jamais de données.** Écriture locale d'abord (file d'attente), envoi
ensuite. Chaque séance porte un `client_uuid` généré sur l'appareil : rejouer une synchronisation
ne crée jamais de doublon. La file locale n'est vidée qu'après confirmation du serveur.

**Aucune donnée personnelle de bénéficiaire.** Seuls des compteurs agrégés par séance sont
stockés : nombre de parents, dont femmes, dont personnes en situation de handicap, score de quiz.
Ni nom, ni photo, ni téléphone d'un parent ou d'un enfant — c'est une contrainte de protection de
l'enfance, pas une simplification.

**Le contenu vit dans la base, pas dans le code.** Modules, quiz, langues, régions et localités
sont pilotables depuis le tableau de bord. Ajouter une langue ne demande aucune modification du
code, ni redéploiement.

**Une route unique pour tous les modules.** `/module?id=N` plutôt qu'une page par module : c'est
ce qui permet à un module créé après le déploiement d'être immédiatement accessible hors-ligne.

### Stack

**Next.js** (App Router, TypeScript strict) · **Supabase** (Postgres, Auth, Storage) ·
**Dexie.js** (IndexedDB) · **Serwist** (service worker / PWA) · **Tailwind CSS** · **shadcn/ui** ·
**TanStack Query** · **Vitest** + **Playwright**

---

## ♿ Accessibilité

Pensée pour un téléphone bon marché, en plein soleil, tenu par quelqu'un peu à l'aise avec le
numérique :

- cibles tactiles ≥ 44 px, contraste AA vérifié, gros caractères ;
- **audio-first** : chaque module est écoutable, pas seulement lisible ;
- vidéos sous-titrées, et une case prête pour la **langue des signes** ;
- `prefers-reduced-motion` respecté ;
- navigation possible sans savoir lire (icônes + audio).

---

## 📁 Documentation technique

| Fichier | Contenu |
| --- | --- |
| `docs/01-CONTEXT.md` | Le problème, la solution, le concours et ses critères |
| `docs/02-ARCHITECTURE.md` | Stack, structure des dossiers, flux hors-ligne → synchro |
| `docs/03-DATA-MODEL.md` | Schéma Supabase, schéma local Dexie, logique de synchro |
| `docs/04-SCREENS.md` | Toutes les pages, leur rôle, leurs états |
| `docs/05-DESIGN-SYSTEM.md` | Couleurs, typographie, accessibilité |
| `docs/06-BUILD-PLAN.md` | Feuille de route par phases |

---

## ❓ En cas de problème

**« Contenu non reçu » à l'ouverture de l'app facilitateur**
Les modules n'ont pas pu être téléchargés. Vérifiez la connexion et appuyez sur « Réessayer ». En
local, vérifiez que les migrations `0015` et suivantes ont bien été exécutées.

**Le bouton « Installer » n'apparaît pas**
Chrome n'émet sa proposition d'installation qu'une fois par session. Le bouton reste néanmoins
présent dans le profil et affiche les instructions manuelles (menu du navigateur → « Installer
l'application »).

**Le mode hors-ligne ne marche pas en local**
Attendu en `pnpm dev` : le service worker y est désactivé. Utilisez `pnpm build && pnpm start`.

**« Cette adresse n'est pas valide » sur mot de passe oublié**
Supabase refuse les adresses dont le domaine n'existe pas, ce qui est le cas des comptes de
démonstration en `@parentrelais.app`. Utilisez une adresse réelle, ou changez le mot de passe
depuis Profil une fois connecté.
