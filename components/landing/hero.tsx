import Link from "next/link";

/**
 * Seule surface autorisée à utiliser --brand-accent (rapprochement isolé du
 * bleu institutionnel, voir app/globals.css) — jamais dans l'UI applicative.
 */
export function Hero() {
  return (
    <section className="bg-gradient-to-br from-brand-accent to-primary-dark px-6 py-20 text-brand-accent-foreground sm:px-10 lg:px-16 lg:py-28">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-6">
        <p className="font-display text-xs font-semibold tracking-wide opacity-80">
          UNICEF CAMEROUN × MINPROFF
        </p>
        <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
          La parentalité positive, prête à animer sur le terrain.
        </h1>
        <p className="max-w-xl text-base opacity-90 sm:text-lg">
          Modules audio, guides d&apos;animation et suivi de séances — même sans réseau.
          ParentRelais accompagne les facilitateurs communautaires là où ils travaillent
          vraiment.
        </p>
        <Link
          href="/login"
          className="font-display mt-2 flex h-11 items-center justify-center rounded-full bg-brand-accent-foreground px-6 text-sm font-semibold text-primary-dark motion-safe:transition hover:opacity-90"
        >
          Se connecter comme facilitateur
        </Link>
      </div>
    </section>
  );
}
