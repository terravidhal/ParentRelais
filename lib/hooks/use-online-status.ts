"use client";

import { useEffect, useState } from "react";

/**
 * navigator.onLine ment parfois (CLAUDE.md / docs/02-ARCHITECTURE.md) mais
 * reste le signal le plus fiable sans backend de ping dédié en Phase 0. Les
 * events online/offline pilotent le déclenchement automatique de la synchro.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() =>
    typeof window === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}
