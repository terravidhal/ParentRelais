/**
 * Localités proposées à la saisie d'une séance.
 *
 * Ce sont des SUGGESTIONS, pas un référentiel : elles couvrent l'Extrême-Nord
 * où se déroule le déploiement pilote. Un facilitateur d'une autre région ne
 * trouverait pas sa localité — c'est une limite connue, traitée au lot 3 du
 * plan (régions et localités pilotables depuis le tableau de bord).
 *
 * Le quiz, lui, ne vit plus ici : il descend de Supabase avec son module
 * (voir migration 0019 et lib/content/fetch-content.ts). Il était auparavant
 * une constante globale, si bien que tous les modules affichaient les mêmes
 * questions.
 */
export const VILLAGES = ["Maroua", "Mokolo", "Kousséri", "Mora"] as const;
