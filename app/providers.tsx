"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";

/**
 * Convention de query keys dans toute l'app :
 * - ["dexie", ...] : lectures/écritures Dexie (zone facilitateur, offline).
 *   Jamais de retry ni de refetchOnWindowFocus par défaut — Dexie ne "périme"
 *   pas avec le temps, seule une écriture locale invalide le cache.
 * - ["dashboard", ...] : vraies requêtes réseau Supabase (zone dashboard).
 *   Un retry réseau explicite peut être activé query par query si besoin.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Rendu serveur : on suppose le petit écran (mobile-first), puis on
  // corrige au montage. Éviter useMediaQuery au premier rendu préviendrait
  // une différence entre HTML serveur et client.
  const [isSmallScreen, setIsSmallScreen] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsSmallScreen(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            refetchOnWindowFocus: false,
            staleTime: Infinity,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Position adaptée à la taille d'écran.

          En bas sur téléphone : un toast en haut passe sous l'encoche
          (viewport-fit=cover) et recouvre la bannière de connectivité,
          l'information la plus importante du produit.

          En haut sur grand écran : mesuré, un toast en bas s'affichait à
          795px sur un écran de 900px — techniquement visible, mais à plus de
          800px du point d'action (la matrice d'upload est en haut de page).
          Les confirmations passaient donc inaperçues. Le retour doit
          apparaître là où se porte le regard. */}
      <Toaster
        position={isSmallScreen ? "bottom-center" : "top-center"}
        offset="calc(1rem + env(safe-area-inset-bottom, 0px))"
        duration={5000}
      />
    </QueryClientProvider>
  );
}
