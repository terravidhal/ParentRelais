import type { Metadata } from "next";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { OfflineShowcase } from "@/components/landing/offline-showcase";
import { LandingFooter } from "@/components/landing/landing-footer";

export const metadata: Metadata = {
  title: "ParentRelais — Parentalité positive sur le terrain",
};

/**
 * Landing publique, hors des route groups (facilitator)/(dashboard) : pas
 * d'auth, pas de dépendance Dexie/seed, en ligne uniquement (voir sw.ts,
 * exclue du précache offline du zone facilitateur). L'app facilitateur
 * authentifiée vit sur /home.
 */
export default function LandingPage() {
  return (
    <div className="flex-1">
      <Hero />
      <HowItWorks />
      <OfflineShowcase />
      <LandingFooter />
    </div>
  );
}
