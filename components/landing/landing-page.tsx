"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  AudioLines,
  BarChart3,
  CircleCheck,
  CloudOff,
  Headphones,
  HeartHandshake,
  Languages,
  Menu,
  Play,
  Radio,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";

/**
 * Photos libres de droits (Pexels) choisies pour leur contexte réel — la
 * première est prise à Mintom, Cameroun, la deuxième au Nigeria voisin.
 * Remplace la version de référence qui pointait vers /manus-storage/*, un
 * hébergement externe non disponible dans ce projet.
 */
const heroImage =
  "https://images.pexels.com/photos/15546252/pexels-photo-15546252.jpeg?auto=compress&cs=tinysrgb&w=1400";
const deviceImage =
  "https://images.pexels.com/photos/38226075/pexels-photo-38226075.jpeg?auto=compress&cs=tinysrgb&w=1200";

const steps = [
  {
    number: "01",
    title: "Préparer",
    text: "Les modules et leurs audios sont disponibles sur le téléphone, sans réseau.",
    icon: Smartphone,
  },
  {
    number: "02",
    title: "Animer",
    text: "Le facilitateur guide la séance, enregistre uniquement des compteurs agrégés.",
    icon: Radio,
  },
  {
    number: "03",
    title: "Synchroniser",
    text: "Dès qu'une connexion revient, les données utiles remontent automatiquement.",
    icon: RefreshCw,
  },
] as const;

function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <g fill="currentColor">
        <circle cx="176" cy="164" r="48" />
        <path d="M176 224c-58 0-96 46-96 112v22h140v-60c0-34 10-58 28-74-24-1-48 0-72 0z" />
        <circle cx="322" cy="232" r="34" />
        <path d="M322 276c-42 0-70 34-70 82v18h108v-52c0-24 6-40 16-52-18-1-38 4-54 4z" />
      </g>
    </svg>
  );
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#EDF1EF] text-[#16241F]">
      <div className="border-b border-[#08596E]/20 bg-[#08596E] px-4 py-2.5 text-center text-xs font-semibold tracking-wide text-white sm:text-sm">
        <span className="mr-2 inline-flex h-2 w-2 rounded-full bg-[#E0961A] align-middle" />
        UNICEF Cameroun × MINPROFF — outil de terrain pour la parentalité positive
      </div>

      <header className="relative z-20 border-b border-[#DCE4E1] bg-[#EDF1EF]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <button
            onClick={() => scrollTo("top")}
            className="group flex items-center gap-3"
            aria-label="Retour en haut"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#0C7C9A] shadow-[0_8px_24px_-14px_rgba(8,89,110,.55)] ring-1 ring-[#DCE4E1] transition-transform duration-200 group-hover:-rotate-3">
              <LogoMark className="h-7 w-7" />
            </span>
            <span className="text-left font-display text-[18px] font-bold tracking-[-.06em]">
              Parent<span className="text-[#0C7C9A]">Relais</span>
              <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-[#E0961A] align-middle" />
            </span>
          </button>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Navigation principale">
            <button
              onClick={() => scrollTo("solution")}
              className="text-sm font-semibold text-[#6B7B77] transition-colors hover:text-[#16241F]"
            >
              La solution
            </button>
            <button
              onClick={() => scrollTo("parcours")}
              className="text-sm font-semibold text-[#6B7B77] transition-colors hover:text-[#16241F]"
            >
              Comment ça marche
            </button>
            <button
              onClick={() => scrollTo("impact")}
              className="text-sm font-semibold text-[#6B7B77] transition-colors hover:text-[#16241F]"
            >
              Pour le programme
            </button>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <span className="flex items-center gap-2 rounded-full bg-[#DDF0E4] px-3 py-2 text-xs font-bold text-[#157A47]">
              <span className="h-2 w-2 rounded-full bg-[#157A47]" /> Conçu pour le terrain
            </span>
            <Link
              href="/login"
              className="rounded-2xl bg-[#0C7C9A] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_22px_-14px_rgba(8,89,110,.75)] transition-all hover:bg-[#08596E] active:scale-[.97]"
            >
              Se connecter comme facilitateur <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
          </div>
          <button
            className="rounded-xl p-2 lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-[#DCE4E1] bg-[#EDF1EF] px-5 py-5 lg:hidden">
            <div className="flex flex-col gap-4">
              <button onClick={() => scrollTo("solution")} className="text-left font-semibold">
                La solution
              </button>
              <button onClick={() => scrollTo("parcours")} className="text-left font-semibold">
                Comment ça marche
              </button>
              <button onClick={() => scrollTo("impact")} className="text-left font-semibold">
                Pour le programme
              </button>
              <Link
                href="/login"
                className="rounded-2xl bg-[#0C7C9A] px-4 py-3 text-left font-bold text-white"
              >
                Se connecter <ArrowRight className="ml-1 inline h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </header>

      <div className="border-b border-[#0C7C9A]/20 bg-[#0C7C9A] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[.14em] text-white sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span>
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#E0961A]" /> Relais actif
          </span>
          <span className="hidden text-white/70 sm:inline">
            Contenu local disponible · Synchro dès que le réseau revient
          </span>
          <span className="flex items-center gap-2 text-[#B5EDF0]">
            <span className="h-2 w-2 rounded-full bg-[#B5EDF0]" /> Prêt hors-ligne
          </span>
        </div>
      </div>

      <section id="top" className="relative border-b border-[#DCE4E1] bg-[#EDF1EF]">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[.92fr_1.08fr] lg:gap-16 lg:px-10 lg:pb-24 lg:pt-24">
          <div className="relative z-10">
            <p className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[.18em] text-[#0C7C9A]">
              <span className="h-px w-8 bg-[#0C7C9A]" /> Boîte à outils pour facilitateurs
            </p>
            <h1 className="max-w-[680px] font-display text-[clamp(2.9rem,6vw,5.55rem)] font-bold leading-[.96] tracking-[-.075em]">
              Le réseau peut manquer.
              <br />
              <span className="text-[#0C7C9A]">Le relais, lui, continue.</span>
            </h1>
            <p className="mt-7 max-w-[550px] text-[17px] leading-8 text-[#52635E] sm:text-lg">
              ParentRelais donne aux facilitateurs communautaires les contenus, l&apos;audio et le
              carnet de séance pour faire vivre la parentalité positive partout au Cameroun —
              même sans connexion.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => scrollTo("solution")}
                className="rounded-2xl bg-[#0C7C9A] px-6 py-4 text-center font-bold text-white shadow-[0_22px_35px_-22px_rgba(8,89,110,.9)] transition-all hover:-translate-y-0.5 hover:bg-[#08596E] active:scale-[.97]"
              >
                Découvrir la solution <ArrowDownRight className="ml-2 inline h-5 w-5" />
              </button>
              <button
                onClick={() => scrollTo("parcours")}
                className="rounded-2xl border border-[#0C7C9A]/30 bg-white/60 px-6 py-4 font-bold text-[#08596E] transition-all hover:bg-white active:scale-[.97]"
              >
                <Play className="mr-2 inline h-4 w-4 fill-current" /> Voir comment ça marche
              </button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-[#6B7B77]">
              <span className="flex items-center gap-2">
                <CircleCheck className="h-4 w-4 text-[#157A47]" /> PWA installable
              </span>
              <span className="flex items-center gap-2">
                <CircleCheck className="h-4 w-4 text-[#157A47]" /> Zéro donnée identifiante
              </span>
            </div>
          </div>
          <div className="relative lg:-mr-20">
            <div className="absolute -left-8 -top-8 h-36 w-36 rounded-full border border-[#0C7C9A]/20 [background-image:radial-gradient(#0C7C9A_1.2px,transparent_1.2px)] [background-size:14px_14px] opacity-70" />
            <div className="relative overflow-hidden rounded-[2rem] rounded-br-[5rem] border-2 border-[#0C7C9A] bg-[#0C7C9A] p-2 shadow-[0_35px_65px_-30px_rgba(8,89,110,.65)]">
              <div className="absolute left-5 top-5 z-10 flex items-center gap-2 rounded-full bg-[#16241F] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white">
                <span className="h-2 w-2 rounded-full bg-[#E0961A]" /> Terrain — Cameroun
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element -- source photo distante (Pexels), pas d'asset local à optimiser */}
              <img
                src={heroImage}
                alt="Enfant souriant à Mintom, Cameroun"
                className="aspect-[16/10] w-full rounded-[1.6rem] object-cover"
              />
              <div className="absolute bottom-7 left-7 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-xl">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FBEFD6] text-[#E0961A]">
                  <CloudOff className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7B77]">
                    État du terrain
                  </span>
                  <span className="block text-sm font-bold">Fonctionne hors-ligne</span>
                </span>
              </div>
            </div>
            <div className="absolute -bottom-5 -right-4 hidden rounded-2xl border border-[#DCE4E1] bg-white px-5 py-4 shadow-[0_20px_40px_-24px_rgba(22,36,31,.45)] sm:block">
              <div className="flex items-center gap-3">
                <span className="font-display text-3xl font-bold text-[#0C7C9A]">01</span>
                <span className="max-w-[130px] text-xs font-semibold leading-4 text-[#6B7B77]">
                  outil pensé pour les réalités locales
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#DCE4E1] bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 py-9 sm:grid-cols-4 sm:px-8 lg:px-10">
          <div>
            <div className="font-display text-3xl font-bold tracking-[-.06em] text-[#0C7C9A]">
              100%
            </div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#6B7B77]">
              hors-ligne possible
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold tracking-[-.06em] text-[#0C7C9A]">
              0 FCFA
            </div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#6B7B77]">
              pour les parents
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold tracking-[-.06em] text-[#0C7C9A]">
              Audio
            </div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#6B7B77]">
              inclusion d&apos;abord
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold tracking-[-.06em] text-[#0C7C9A]">
              1 → ∞
            </div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#6B7B77]">
              facilitateur démultiplié
            </div>
          </div>
        </div>
      </section>

      <section id="solution" className="relative bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-[#E0961A]">
                Le besoin réel
              </p>
              <h2 className="max-w-sm font-display text-4xl font-bold leading-[1.04] tracking-[-.06em] sm:text-5xl">
                Le contenu existe.
                <br />
                <span className="text-[#0C7C9A]">L&apos;accès doit suivre.</span>
              </h2>
              <p className="mt-6 max-w-sm leading-7 text-[#6B7B77]">
                Les formations présentielles fonctionnent, mais touchent peu de familles. Dans
                les zones les plus concernées, ce n&apos;est pas le besoin qui manque : c&apos;est
                la connexion.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="border-l-4 border-[#C2410C] bg-[#FBE6DC] p-6 sm:p-8">
                <CloudOff className="mb-12 h-7 w-7 text-[#C2410C]" />
                <h3 className="font-display text-2xl font-bold tracking-[-.04em]">
                  Quand le réseau disparaît
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#6B7B77]">
                  Une application 100% connectée exclut précisément les familles qu&apos;elle
                  veut aider.
                </p>
              </article>
              <article className="border-l-4 border-[#0C7C9A] bg-[#EDF1EF] p-6 sm:p-8">
                <HeartHandshake className="mb-12 h-7 w-7 text-[#0C7C9A]" />
                <h3 className="font-display text-2xl font-bold tracking-[-.04em]">
                  Le facilitateur reste là
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#6B7B77]">
                  Il traduit, adapte, écoute. ParentRelais lui donne les bons supports, au bon
                  moment.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section id="parcours" className="bg-[#16241F] py-20 text-white sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-[#E0961A]">
                Un geste simple
              </p>
              <h2 className="max-w-2xl font-display text-4xl font-bold leading-[1.05] tracking-[-.06em] sm:text-5xl">
                Écouter. Animer.
                <br />
                <span className="text-[#7BD0D9]">Synchroniser quand le réseau revient.</span>
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-6 text-white/60">
              Une expérience conçue pour un téléphone partagé, un écran lisible et une connexion
              imprévisible.
            </p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-[2rem] bg-white/15 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.number}
                  className="group bg-[#1D302A] p-7 transition-colors hover:bg-[#244239] sm:p-9"
                >
                  <div className="mb-14 flex items-center justify-between">
                    <span className="font-display text-sm font-bold text-[#E0961A]">
                      {step.number}
                    </span>
                    <Icon className="h-6 w-6 text-[#7BD0D9] transition-transform duration-200 group-hover:-translate-y-1" />
                  </div>
                  <h3 className="font-display text-2xl font-bold tracking-[-.04em]">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-white/60">{step.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#EDF1EF] py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-20 lg:px-10">
          <div className="relative order-2 lg:order-1">
            <div className="absolute -bottom-7 -left-7 h-32 w-32 border-b-2 border-l-2 border-[#E0961A]" />
            {/* eslint-disable-next-line @next/next/no-img-element -- source photo distante (Pexels) */}
            <img
              src={deviceImage}
              alt="Enfants réunis en extérieur, Afrique de l'Ouest"
              className="relative aspect-[4/3] w-full rounded-[2rem] object-cover shadow-[0_30px_55px_-35px_rgba(8,89,110,.65)]"
            />
            <div className="absolute -right-3 top-7 rounded-2xl bg-[#E0961A] px-4 py-3 text-sm font-bold text-[#16241F] shadow-lg sm:-right-6">
              <AudioLines className="mr-2 inline h-4 w-4" /> Audio-first
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-[#0C7C9A]">
              L&apos;outil entre les mains
            </p>
            <h2 className="max-w-xl font-display text-4xl font-bold leading-[1.04] tracking-[-.06em] sm:text-5xl">
              Une technologie discrète.
              <br />
              <span className="text-[#0C7C9A]">Un impact qui circule.</span>
            </h2>
            <p className="mt-6 max-w-lg leading-7 text-[#6B7B77]">
              Tout est pensé pour être compris au premier regard et utilisé en plein soleil :
              gros boutons, états de connexion explicites, audios accessibles et données toujours
              enregistrées localement.
            </p>
            <div className="mt-8 space-y-4">
              {[
                {
                  icon: Languages,
                  title: "Les langues suivent les territoires",
                  text: "FR et EN dès le départ. Fulfulde et langue des signes : des cases prêtes à remplir.",
                },
                {
                  icon: ShieldCheck,
                  title: "La confidentialité n'est pas négociable",
                  text: "Aucun nom, aucune photo, aucun téléphone. Seulement des compteurs agrégés par séance.",
                },
                {
                  icon: Smartphone,
                  title: "Un simple téléphone suffit",
                  text: "Une PWA installable, sans store et sans équipement supplémentaire.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4">
                  <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#0C7C9A] shadow-sm">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#6B7B77]">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="impact" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[.82fr_1.18fr] lg:gap-20">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-[#E0961A]">
                Pour piloter autrement
              </p>
              <h2 className="max-w-md font-display text-4xl font-bold leading-[1.04] tracking-[-.06em] sm:text-5xl">
                Du geste local à la <span className="text-[#0C7C9A]">vision nationale.</span>
              </h2>
              <p className="mt-6 max-w-md leading-7 text-[#6B7B77]">
                Quand la connexion revient, le tableau de bord transforme les séances de terrain
                en une lecture claire de la couverture.
              </p>
              <div className="mt-8 flex items-center gap-3 text-sm font-bold text-[#157A47]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#157A47]" /> Synchronisation
                différée, jamais de séance perdue
              </div>
            </div>
            <div className="rounded-[2rem] bg-[#EDF1EF] p-5 sm:p-8">
              <div className="mb-6 flex items-center justify-between border-b-2 border-[#0C7C9A] pb-5">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#0C7C9A]">
                    Couverture nationale
                  </div>
                  <div className="mt-1 font-display text-xl font-bold">Tableau de bord pilote</div>
                </div>
                <span className="flex items-center gap-2 border border-[#157A47]/30 bg-[#DDF0E4] px-3 py-2 text-xs font-bold text-[#157A47]">
                  <span className="h-2 w-2 rounded-full bg-[#157A47]" /> En ligne
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:gap-5">
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs font-semibold text-[#6B7B77]">Familles touchées</div>
                  <div className="mt-3 font-display text-3xl font-bold text-[#0C7C9A]">
                    1 248
                  </div>
                  <div className="mt-2 text-xs font-semibold text-[#157A47]">↑ sur le terrain</div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs font-semibold text-[#6B7B77]">Séances</div>
                  <div className="mt-3 font-display text-3xl font-bold text-[#0C7C9A]">86</div>
                  <div className="mt-2 text-xs font-semibold text-[#157A47]">4 localités</div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs font-semibold text-[#6B7B77]">Handicap</div>
                  <div className="mt-3 font-display text-3xl font-bold text-[#0C7C9A]">74</div>
                  <div className="mt-2 text-xs font-semibold text-[#6B7B77]">participants</div>
                </div>
              </div>
              <div className="mt-6 border-t-2 border-[#DCE4E1] bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#6B7B77]">
                    Familles par localité / données synchronisées
                  </span>
                  <BarChart3 className="h-4 w-4 text-[#0C7C9A]" />
                </div>
                {[
                  { name: "Maroua", value: "86%" },
                  { name: "Mokolo", value: "63%" },
                  { name: "Kousséri", value: "48%" },
                  { name: "Mora", value: "31%" },
                ].map((item) => (
                  <div key={item.name} className="mb-3 flex items-center gap-3 text-xs font-semibold">
                    <span className="w-16 text-[#6B7B77]">{item.name}</span>
                    <div className="h-2 flex-1 rounded-full bg-[#EDF1EF]">
                      <div
                        className="h-2 rounded-full bg-[#0C7C9A]"
                        style={{ width: item.value }}
                      />
                    </div>
                    <span className="w-8 text-right text-[#16241F]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#FBEFD6] py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
          <div className="mx-auto mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#E0961A] shadow-sm">
            <Headphones className="h-7 w-7" />
          </div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-[#C0780F]">
            Accessibilité d&apos;abord
          </p>
          <h2 className="mx-auto max-w-3xl font-display text-4xl font-bold leading-[1.04] tracking-[-.06em] sm:text-5xl">
            Quand le contenu peut s&apos;écouter,
            <br />
            <span className="text-[#C0780F]">personne ne reste au bord du chemin.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#6B7B77]">
            L&apos;audio contourne l&apos;analphabétisme, sert l&apos;inclusion des personnes
            non-voyantes et permet au facilitateur de transmettre dans les langues qui font sens
            localement.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3 text-sm font-bold">
            <span className="rounded-full bg-white px-4 py-3 text-[#16241F]">
              Audio en langues locales
            </span>
            <span className="rounded-full bg-white px-4 py-3 text-[#16241F]">
              Sous-titres vidéo
            </span>
            <span className="rounded-full bg-white px-4 py-3 text-[#16241F]">
              Langue des signes prévue
            </span>
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="relative overflow-hidden bg-[#0C7C9A] py-20 text-white sm:py-28"
      >
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-20 [background-image:radial-gradient(#fff_1.2px,transparent_1.2px)] [background-size:16px_16px]" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-[#B5EDF0]">
                La prochaine étape
              </p>
              <h2 className="max-w-3xl font-display text-4xl font-bold leading-[1.02] tracking-[-.06em] sm:text-6xl">
                Prêt à animer votre première séance ?
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-white/75">
                Connectez-vous avec votre code facilitateur — même sans réseau, vous pouvez
                commencer tout de suite.
              </p>
            </div>
            <Link
              href="/login"
              className="rounded-2xl bg-white px-6 py-4 text-center font-bold text-[#08596E] shadow-xl transition-all hover:-translate-y-1 active:scale-[.97]"
            >
              Se connecter comme facilitateur <ArrowRight className="ml-2 inline h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-[#16241F] py-9 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#7BD0D9]">
              <LogoMark className="h-6 w-6" />
            </span>
            <span className="font-display text-lg font-bold tracking-[-.05em]">
              Parent<span className="text-[#7BD0D9]">Relais</span>
              <span className="ml-1 inline-block h-2 w-2 rounded-full bg-[#E0961A] align-middle" />
            </span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-white/55">
            <span>UNICEF Cameroon × MINPROFF</span>
            <span>Prototype 2026</span>
            <span>Conçu pour le terrain</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/login" className="font-bold text-[#7BD0D9] hover:underline">
              Se connecter
            </Link>
            <Link href="/dashboard/login" className="text-white/35 hover:underline">
              Administration
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
