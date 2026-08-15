"use client";

import { useState } from "react";
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
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
