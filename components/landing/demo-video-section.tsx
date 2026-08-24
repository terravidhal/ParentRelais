"use client";

import { useEffect, useRef, useState } from "react";
import { PlayCircle, Volume2, VolumeX } from "lucide-react";

/**
 * Démonstration filmée, placée immédiatement sous le hero.
 *
 * Position choisie délibérément : c'est un concours, et le jury doit voir le
 * produit fonctionner avant tout argumentaire. Plus bas dans la page, elle
 * dépendait d'un défilement que rien ne garantit.
 *
 * La lecture démarre quand la section entre dans le champ et s'arrête quand
 * elle en sort : le visiteur n'a rien à cliquer pour voir le produit.
 *
 * `preload="metadata"` : seules les métadonnées sont chargées tant que la
 * lecture n'a pas commencé. Les 2,6 Mo ne pèsent donc pas sur l'ouverture de
 * la page — ce qui compte sur une connexion de terrain.
 */
export function DemoVideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  // Muet au départ : tous les navigateurs refusent une lecture automatique
  // avec son. Le bouton ci-dessous rend le son à qui le veut.
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;

    // Respect de prefers-reduced-motion : une vidéo qui démarre seule est
    // exactement le genre de mouvement que ce réglage vise à éviter. Les
    // contrôles restent disponibles pour la lancer à la main.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // `play()` renvoie une promesse rejetée si le navigateur refuse :
          // sans ce catch, la console se remplit d'erreurs non capturées.
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      // 55 % visible : assez pour que la vidéo soit vraiment regardée, pas
      // seulement effleurée au passage.
      { threshold: 0.55 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (!video.muted) void video.play().catch(() => {});
  };

  return (
    <section
      ref={sectionRef}
      id="demonstration"
      className="scroll-mt-24 border-b border-[#DCE4E1] bg-foreground py-14 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
          <div className="text-white">
            <p className="flex items-center gap-2 text-sm font-bold tracking-[0.2em] text-[#7BD0D9]">
              <PlayCircle className="h-4 w-4" aria-hidden="true" />
              LA DÉMONSTRATION EN 90 SECONDES
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Voyez l&apos;application animer une séance,
              <br className="hidden sm:block" /> réseau coupé.
            </h2>
            <p className="mt-4 max-w-xl text-lg text-white/75">
              Un facilitateur ouvre un module, coupe sa connexion, anime une
              séance entière, puis retrouve le réseau — la séance remonte seule
              jusqu&apos;au tableau de bord national.
            </p>

            <ul className="mt-6 flex flex-col gap-2.5 text-sm text-white/80">
              {[
                "Filmé dans l'application réelle, sans montage",
                "Le passage hors-ligne se voit à l'écran",
                "Les deux espaces : terrain et pilotage",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={toggleSound}
              className="mt-6 flex h-12 items-center gap-2 rounded-2xl border border-white/25 px-4 text-sm font-semibold text-white motion-safe:transition-colors hover:bg-white/10"
            >
              {muted ? (
                <>
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                  Activer le son
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4" aria-hidden="true" />
                  Couper le son
                </>
              )}
            </button>
          </div>

          {/* La vignette est extraite de la vidéo elle-même : celle de
              l'accueil facilitateur induisait en erreur, la démonstration
              commençant sur la page publique. */}
          <figure className="mx-auto w-full max-w-[320px]">
            <div className="overflow-hidden rounded-[28px] border-4 border-white/15 bg-black shadow-[0_30px_60px_-25px_rgba(0,0,0,.8)]">
              <video
                ref={videoRef}
                src="/demo/parentrelais-demo.mp4"
                controls
                muted
                loop
                playsInline
                preload="metadata"
                poster="/demo/poster.png"
                className="block w-full"
                aria-label="Démonstration : une séance animée sans réseau, puis synchronisée avec le tableau de bord"
              />
            </div>
            <figcaption className="mt-3 text-center text-xs text-white/55">
              Enregistré sur un écran de téléphone · 1 min 29
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
