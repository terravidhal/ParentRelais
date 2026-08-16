import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "ParentRelais — Parentalité positive sur le terrain",
};

/**
 * Landing publique, hors des route groups (facilitator)/(dashboard) : pas
 * d'auth, pas de dépendance Dexie/seed, en ligne uniquement (voir sw.ts,
 * exclue du précache offline du zone facilitateur). L'app facilitateur
 * authentifiée vit sur /home.
 */
export default function Page() {
  return <LandingPage />;
}
