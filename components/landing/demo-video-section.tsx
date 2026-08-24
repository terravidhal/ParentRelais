import { PlayCircle } from "lucide-react";

/**
 * Démonstration filmée, placée immédiatement sous le hero.
 *
 * Position choisie délibérément : c'est un concours, et le jury doit voir le
 * produit fonctionner avant tout argumentaire. Plus bas dans la page, elle
 * dépendait d'un défilement que rien ne garantit.
 *
 * `preload="metadata"` : seules les métadonnées sont chargées tant que le
 * visiteur ne lance pas la lecture. Les 2,6 Mo ne pèsent donc pas sur
 * l'ouverture de la page — ce qui compte sur une connexion de terrain.
 */
export function DemoVideoSection() {
  return (
    <section
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
          </div>

          {/* La vignette est extraite de la vidéo elle-même : celle de
              l'accueil facilitateur induisait en erreur, la démonstration
              commençant sur la page publique. */}
          <figure className="mx-auto w-full max-w-[320px]">
            <div className="overflow-hidden rounded-[28px] border-4 border-white/15 bg-black shadow-[0_30px_60px_-25px_rgba(0,0,0,.8)]">
              <video
                src="/demo/parentrelais-demo.mp4"
                controls
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
