# PRODUCT.md — ParentRelais

> Contexte stratégique du produit. Voir aussi `05-DESIGN-SYSTEM.md` (système visuel),
> `CLAUDE.md` (règles d'architecture non négociables), `01-CONTEXT.md` (contexte programme).

## Register

**Hybride, avec deux surfaces distinctes qui ne se confondent jamais :**

- **Zone facilitateur** (`app/(facilitator)/`) — **product**. Outil de terrain. Le design SERT
  la tâche : animer une séance, consulter un module, synchroniser. Aucune ambition esthétique
  au-delà de la lisibilité et de la fiabilité.
- **Zone dashboard** (`app/(dashboard)/`) — **product**. Outil de pilotage programme pour
  l'UNICEF/MINPROFF. Densité d'information, tables, KPI.
- **Landing publique** (`app/page.tsx`) — **brand**. Seule surface où le design EST le produit
  (vitrine concours / partenaires institutionnels).

Register par défaut du projet : **product**.

## Utilisateurs & finalité

**Utilisateur principal — le facilitateur communautaire.** Terrain rural camerounais
(Extrême-Nord, Adamaoua, Nord-Ouest). Téléphone bon marché, **souvent hors-ligne**, parfois en
plein soleil, parfois peu à l'aise avec le numérique. Sa tâche : animer une séance de parentalité
positive auprès de parents, enregistrer des compteurs agrégés, synchroniser quand le réseau
revient. **Chaque décision d'UI se juge à cette aune.**

**Utilisateur secondaire — l'administrateur programme (UNICEF / MINPROFF).** Bureau, en ligne,
écran desktop. Sa tâche : piloter la couverture (familles touchées, séances, handicap), suivre
l'activité des facilitateurs, exporter des bilans, alimenter les contenus multilingues.

**Contrainte de fond** : aucune donnée personnelle identifiante de bénéficiaire (parent/enfant)
n'est jamais collectée — uniquement des compteurs agrégés. L'identité **facilitateur** (personnel
du programme) est en revanche assumée et destinée à s'enrichir.

## Personnalité de marque

**Institutionnel, sobre, fiable.** Trois mots : *sérieux, lisible, humain*.

Ce n'est ni une app grand public ludique, ni un SaaS. C'est un instrument humanitaire : il doit
inspirer la confiance d'une institution (UNICEF/MINPROFF) tout en restant chaleureux — la couleur
ocre porte cette chaleur, le cyan porte l'institution.

## Anti-références (ce que ce produit ne doit jamais devenir)

- **SaaS générique** : hero-métrique, cartes identiques en grille, dégradés décoratifs.
- **Beige/crème « editorial warmth »** : explicitement banni par `05-DESIGN-SYSTEM.md`
  (`paper` = blanc cassé **froid** `#EDF1EF`, pas un crème).
- **Glassmorphism / effets décoratifs** : illisibles en plein soleil sur écran bas de gamme.
- **Gris clair sur blanc** pour l'information importante : contraste AA minimum obligatoire.
- **Faux layout desktop natif** pour la zone facilitateur : le produit est mobile-first par nature,
  mais doit rester crédible et propre en desktop (démo jury) — sans prétendre être une app desktop.

## Principes de design stratégiques

1. **L'état de connexion est l'information n°1.** Bannière pleine largeur, jamais reléguée.
   Vert = en ligne, rouge = hors-ligne, orange = à synchroniser. Ce mapping est fonctionnel et
   ne doit jamais être dilué en décoration.
2. **Audio-first.** Tout module est consultable en écoutant, pas seulement en lisant.
3. **Cibles tactiles ≥ 44px partout**, espacées, pensées pour de gros doigts et un usage debout.
4. **Rien ne dépend du réseau côté facilitateur.** Écriture locale d'abord (Dexie/outbox),
   synchronisation ensuite, jamais de perte de données.
5. **Ajouter une langue ou un média = remplir une case**, jamais une refonte.
6. **Le texte explique quoi faire.** Erreurs actionnables, écrans vides qui invitent à agir.

## Accessibilité — exigences, pas options

Critère noté au concours. Contraste AA minimum, cibles ≥44px, navigation possible sans savoir
lire (icônes + audio), vidéos sous-titrées, emplacement langue des signes prévu, focus clavier
visible, `prefers-reduced-motion` respecté, jamais de police sous 12px.
