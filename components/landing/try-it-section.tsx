"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  PlaneTakeoff,
  Smartphone,
  Wifi,
  WifiOff,
} from "lucide-react";

/**
 * « Essayez vous-même » — le mode d'emploi destiné au jury.
 *
 * Le mode hors-ligne est la valeur centrale du produit, mais il ne se voit
 * pas : un visiteur qui reste dans son navigateur, connecté, ne verra qu'une
 * application web ordinaire. Il faut donc lui DIRE quoi faire, dans l'ordre,
 * et expliquer pourquoi l'installation n'est pas optionnelle.
 *
 * L'animation illustre le passage en ligne → hors-ligne. Elle est en
 * SVG/CSS plutôt qu'en vidéo : rien à encoder, rien à héberger, et elle
 * fonctionne elle-même sans réseau.
 */

const STEPS = [
  {
    icon: Smartphone,
    title: "Installez l'application",
    detail:
      "Espace facilitateur → Profil → « Installer ». Sur iPhone : Partager → « Sur l'écran d'accueil ».",
    warning:
      "Ce n'est pas optionnel : sans installation, le navigateur peut perdre l'accès hors connexion.",
  },
  {
    icon: Download,
    title: "Téléchargez les médias",
    detail:
      "Accueil → Téléchargements. Chaque module indique s'il est disponible hors-ligne.",
    warning:
      "Rien ne se télécharge tout seul : le forfait du facilitateur ne se consomme jamais à son insu.",
  },
  {
    icon: PlaneTakeoff,
    title: "Coupez le réseau",
    detail:
      "Mode avion, puis rouvrez l'application. Consultez un module, écoutez l'audio, animez une séance entière.",
    warning: null,
  },
  {
    icon: Wifi,
    title: "Rétablissez la connexion",
    detail:
      "La séance remonte toute seule et apparaît dans l'espace de pilotage, sous Couverture et Rapports.",
    warning: null,
  },
] as const;

/**
 * Bascule en ligne / hors-ligne, en boucle.
 *
 * Le message tient en une image : le nuage se détache, et l'application
 * continue de fonctionner. C'est exactement ce que le jury doit retenir.
 */
/** Lu hors de React : `matchMedia` n'existe pas au rendu serveur. */
function subscribeToReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function readReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function OfflineAnimation() {
  const [ticking, setTicking] = useState(false);
  // `useSyncExternalStore` plutôt qu'un effet : conçu pour lire une valeur
  // extérieure à React sans incohérence d'hydratation ni cascade de rendus.
  const reduced = useSyncExternalStore(
    subscribeToReducedMotion,
    readReducedMotion,
    () => false,
  );

  // Dérivé plutôt que stocké : avec `prefers-reduced-motion`, on fige l'état
  // hors-ligne — c'est le message à retenir — au lieu de faire clignoter
  // l'écran. Le calculer ici évite un setState dans l'effet.
  const offline = reduced ? true : ticking;

  useEffect(() => {
    if (reduced) return;
    const timer = window.setInterval(() => setTicking((v) => !v), 3200);
    return () => window.clearInterval(timer);
  }, [reduced]);

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-[#DCE4E1] bg-background p-6"
      aria-label="Démonstration : l'application continue de fonctionner sans réseau"
      role="img"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Le serveur */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="4" width="18" height="6" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <rect x="3" y="14" width="18" height="6" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="7" cy="7" r="1" fill="currentColor" />
              <circle cx="7" cy="17" r="1" fill="currentColor" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-[#6B7B77]">Serveur</span>
        </div>

        {/* Le lien réseau, qui se rompt */}
        <div className="relative flex flex-1 items-center justify-center">
          <div className="h-0.5 w-full rounded-full bg-[#DCE4E1]" />
          <div
            className={`absolute h-0.5 rounded-full bg-primary motion-safe:transition-all motion-safe:duration-700 ${
              offline ? "w-0 opacity-0" : "w-full opacity-100"
            }`}
          />
          <span
            className={`absolute flex h-9 w-9 items-center justify-center rounded-full motion-safe:transition-colors motion-safe:duration-500 ${
              offline
                ? "bg-[#FBE6DC] text-[#C2410C]"
                : "bg-[#DDF0E4] text-[#157A47]"
            }`}
          >
            {offline ? (
              <WifiOff size={17} aria-hidden="true" />
            ) : (
              <Wifi size={17} aria-hidden="true" />
            )}
          </span>
        </div>

        {/* Le téléphone, qui continue */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="relative flex h-20 w-12 items-center justify-center rounded-xl border-2 border-foreground bg-white">
            <div className="absolute top-1 h-0.5 w-4 rounded-full bg-foreground/30" />
            <div className="flex flex-col items-center gap-1">
              <CheckCircle2 size={16} className="text-[#157A47]" aria-hidden="true" />
              <span className="h-0.5 w-5 rounded-full bg-[#DCE4E1]" />
              <span className="h-0.5 w-4 rounded-full bg-[#DCE4E1]" />
            </div>
          </div>
          <span className="text-xs font-semibold text-[#6B7B77]">Facilitateur</span>
        </div>
      </div>

      <p
        className={`mt-5 rounded-2xl px-4 py-3 text-center text-sm font-semibold motion-safe:transition-colors motion-safe:duration-500 ${
          offline
            ? "bg-[#FBEFD6] text-[#6B4A3A]"
            : "bg-[#DDF0E4] text-[#157A47]"
        }`}
      >
        {offline
          ? "Sans réseau — les modules, les séances et l'historique restent disponibles."
          : "En ligne — les séances animées remontent automatiquement."}
      </p>
    </div>
  );
}

export function TryItSection() {
  return (
    <section id="essayer" className="scroll-mt-24 bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-sm font-bold tracking-[0.2em] text-primary">
          ESSAYEZ VOUS-MÊME
        </p>
        <h2 className="mt-3 max-w-3xl text-3xl font-bold sm:text-4xl">
          Le hors-ligne ne se voit pas depuis un navigateur connecté.
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-[#4A5B57]">
          Suivez ces quatre étapes : c&apos;est le parcours réel d&apos;un
          facilitateur qui s&apos;équipe en ville avant de partir travailler en
          zone sans couverture.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <ol className="flex flex-col gap-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  className="flex gap-4 rounded-2xl border border-[#DCE4E1] bg-white p-4"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold">
                      <span className="text-primary">{index + 1}.</span>{" "}
                      {step.title}
                    </p>
                    <p className="mt-1 text-sm text-[#4A5B57]">{step.detail}</p>
                    {step.warning && (
                      <p className="mt-2 rounded-xl bg-[#FBEFD6] px-3 py-2 text-xs font-semibold text-[#6B4A3A]">
                        {step.warning}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="flex flex-col gap-4 lg:sticky lg:top-24">
            {/* La démonstration filmée passe avant l'animation : elle montre
                l'application réelle, pas une illustration. */}
            <figure className="overflow-hidden rounded-3xl border border-[#DCE4E1] bg-foreground">
              <video
                src="/demo/parentrelais-demo.mp4"
                controls
                playsInline
                preload="metadata"
                poster="/screenshots/mobile-accueil.png"
                className="mx-auto block max-h-[520px] w-auto"
                aria-label="Démonstration : une séance animée sans réseau, puis synchronisée"
              />
              <figcaption className="px-4 py-3 text-center text-xs text-white/70">
                73 secondes — du premier module à la remontée dans le tableau
                de bord, réseau coupé au milieu.
              </figcaption>
            </figure>

            <OfflineAnimation />

            <div className="rounded-2xl border border-[#DCE4E1] bg-white p-4">
              <p className="text-sm font-bold">Identifiants de démonstration</p>
              <dl className="mt-2 flex flex-col gap-2 text-sm">
                <div>
                  <dt className="text-xs font-semibold text-[#6B7B77]">
                    Facilitateur
                  </dt>
                  <dd className="break-all font-mono text-xs">
                    facilitateur.demo@parentrelais.app · DemoTerrain2026! · PIN
                    1234
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-[#6B7B77]">
                    Pilotage
                  </dt>
                  <dd className="break-all font-mono text-xs">
                    demo@parentrelais.app · ParentRelais2026!
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-[#6B7B77]">
                Les formulaires se pré-remplissent en un clic : rien à recopier.
              </p>
              <Link
                href="/login"
                className="mt-3 flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-4 font-bold text-white motion-safe:transition-all hover:bg-primary-dark"
              >
                Commencer le test
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
