"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * État du réseau.
 *
 * `navigator.onLine` seul ne suffit pas : mesuré, il reste à `true` quand la
 * page a été servie par le service worker alors que le réseau est coupé — le
 * navigateur voit une interface active, pas un accès réel à Internet. Le
 * bandeau annonçait donc « En ligne » à un facilitateur en zone blanche,
 * exactement l'inverse de ce qu'il doit savoir.
 *
 * On le complète par une vérification réelle : une requête légère vers
 * Supabase, relancée périodiquement et à chaque événement réseau. Un échec
 * signifie « pas d'accès », quoi qu'en dise `navigator.onLine`.
 */
function subscribe(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/** Vérification active : le serveur répond-il vraiment ? */
async function probeNetwork(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return navigator.onLine;
  try {
    // `no-store` : la réponse ne doit jamais venir d'un cache, sinon la
    // sonde confirmerait une connexion inexistante.
    await fetch(`${url}/auth/v1/health`, {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    return true;
  } catch {
    return false;
  }
}

export function useOnlineStatus(): boolean {
  // Signal immédiat du navigateur : suffisant pour détecter une coupure
  // pendant l'usage, et disponible sans attendre.
  const browserOnline = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );

  // Confirmation par sonde, pour les cas où le navigateur se trompe.
  const [reachable, setReachable] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const ok = await probeNetwork();
      if (!cancelled) setReachable(ok);
    };

    void check();
    // Toutes les 20 s : assez pour que le retour du réseau soit détecté
    // rapidement, assez rare pour ne pas peser sur une connexion de terrain.
    const timer = window.setInterval(() => void check(), 20_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [browserOnline]);

  // Les deux doivent être d'accord : le navigateur peut se tromper dans un
  // seul sens (dire « en ligne » à tort), jamais l'inverse.
  return browserOnline && reachable;
}
