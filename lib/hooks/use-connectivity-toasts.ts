"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Annonce les changements d'état réseau.
 *
 * Sans ce retour, un facilitateur dont la connexion tombe en pleine action
 * ne comprend pas pourquoi plus rien n'aboutit — constat de test terrain :
 * « j'appuie sur des boutons, ils ne répondent pas, je ne sais pas si c'est
 * ma connexion ».
 *
 * `hasPendingWork` évite un doublon : quand des séances attendent d'être
 * synchronisées, la synchro se déclenche au retour du réseau et affiche déjà
 * son propre toast (voir use-sync-outbox-mutation.ts). On ne l'annonce donc
 * que lorsqu'il n'y a rien à synchroniser, sinon deux messages se
 * succèdent pour le même événement.
 *
 * Limite connue, vérifiée par test : au retour du réseau, le service worker
 * (skipWaiting + clientsClaim dans sw.ts) prend le contrôle et recharge la
 * page ; un toast émis à cet instant précis peut donc disparaître avant
 * d'être lu. Le toast hors-ligne, lui, s'affiche toujours — c'est le plus
 * important des deux, puisque c'est celui qui explique pourquoi une action
 * semble ne rien faire.
 */
export function useConnectivityToasts(
  online: boolean,
  hasPendingWork = false,
): void {
  // Dernier état annoncé : initialisé à l'état courant pour ne rien dire au
  // premier rendu, seules les transitions comptent. Une ref plutôt qu'un
  // état : cette valeur ne doit jamais provoquer de rendu.
  const lastAnnouncedRef = useRef(online);

  useEffect(() => {
    const previous = lastAnnouncedRef.current;
    if (previous === online) return;
    lastAnnouncedRef.current = online;

    if (online) {
      // La synchro annoncera elle-même le résultat.
      if (hasPendingWork) return;
      toast.success("Connexion rétablie", { duration: 3500 });
    } else {
      toast.warning("Vous êtes hors-ligne", {
        description:
          "Vous pouvez continuer : tout est enregistré sur l'appareil et partira au retour du réseau.",
        duration: 6000,
      });
    }
    // La garde `previous === online` en tête d'effet fait que seul un vrai
    // changement d'état déclenche un toast, même si hasPendingWork évolue.
  }, [online, hasPendingWork]);
}
