import { Headphones, ClipboardCheck, RefreshCw } from "lucide-react";

const STEPS = [
  {
    icon: Headphones,
    title: "1. Écouter un module",
    description:
      "Chaque module de formation se consulte en l'écoutant — audio-first, pensé pour un usage sans forcément savoir lire.",
  },
  {
    icon: ClipboardCheck,
    title: "2. Animer une séance",
    description:
      "Présences, quiz et compteurs agrégés sont enregistrés directement sur l'appareil, réseau coupé ou non.",
  },
  {
    icon: RefreshCw,
    title: "3. Synchroniser automatiquement",
    description:
      "Dès que le réseau revient, les séances remontent vers le tableau de bord — familles touchées, par localité.",
  },
] as const;

/**
 * Seule section avec une numérotation : c'est une vraie séquence
 * (online → offline → online), pas une décoration.
 */
export function HowItWorks() {
  return (
    <section className="px-6 py-16 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Ce que ça fait
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.title}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <step.icon size={20} aria-hidden="true" />
              </div>
              <h3 className="font-display font-bold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
