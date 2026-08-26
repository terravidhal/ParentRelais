"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Play, Users } from "lucide-react";
import { useModuleQuery } from "@/lib/hooks/use-modules-query";
import {
  usePreferredLangQuery,
  useSetPreferredLangMutation,
} from "@/lib/hooks/use-preferred-lang";
import { LangPills } from "@/components/facilitator/lang-pills";
import { AudioPlayer } from "@/components/facilitator/audio-player";
import { VideoPlayer } from "@/components/facilitator/video-player";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function ModuleView({ id }: { id: number }) {
  const router = useRouter();
  const { data: module, isLoading } = useModuleQuery(id);
  const { data: lang = "fr" } = usePreferredLangQuery();
  const setLangMutation = useSetPreferredLangMutation();
  const [guideOpen, setGuideOpen] = useState(false);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!module) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">
          Ce module n&apos;est pas disponible sur cet appareil. Reconnectez-vous
          une fois en ligne pour récupérer le contenu.
        </p>
        <button
          type="button"
          onClick={() => router.push("/home")}
          className="font-display flex h-12 items-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Revenir aux modules
        </button>
      </div>
    );
  }

  const translation =
    module.translations.find((t) => t.lang === lang) ??
    module.translations.find((t) => t.lang === "fr")!;
  const isPending = translation.status === "pending";
  const displayTranslation = isPending
    ? module.translations.find((t) => t.lang === "fr")!
    : translation;

  return (
    <div className="lg:mx-auto lg:max-w-5xl">
      <button
        type="button"
        onClick={() => router.push("/home")}
        className="mb-3 flex h-11 items-center gap-1 text-sm font-semibold text-primary"
      >
        <ChevronLeft size={16} aria-hidden="true" /> Retour
      </button>

      <div className="flex items-center justify-between">
        <span className="font-display rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
          Module {module.id}
        </span>
        <LangPills
          lang={lang}
          onLangChange={(l) => setLangMutation.mutate(l)}
          // La disponibilité vient du contenu RÉEL du module, plus d'une
          // liste figée : une langue dont la traduction est prête doit être
          // proposée, et une langue vide doit être grisée.
          availableLangs={module.translations
            .filter((t) => t.status === "ready")
            .map((t) => t.lang)}
        />
      </div>

      {/* Deux zones à lg: : le contenu à consulter à gauche, le guide et
          l'action à droite. Le lecteur vidéo n'est volontairement pas
          étiré à toute la largeur — au-delà de ~700px, les proportions
          deviennent inconfortables. */}
      <div className="mt-2 lg:grid lg:grid-cols-[1.25fr_1fr] lg:items-start lg:gap-8">
      <div>
      <div lang={displayTranslation.lang}>
        <h2 className="font-display text-xl font-bold">
          {displayTranslation.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {displayTranslation.summary}
        </p>
      </div>

      {displayTranslation.audio_url && (
        <AudioPlayer src={displayTranslation.audio_url} lang={displayTranslation.lang} />
      )}

      {displayTranslation.video_url ? (
        <VideoPlayer
          src={displayTranslation.video_url}
          lang={displayTranslation.lang}
          subtitlesUrl={displayTranslation.subtitles_url}
        />
      ) : (
        <div className="mt-3 flex h-[90px] items-center justify-center rounded-2xl bg-foreground text-background">
          <Play size={22} aria-hidden="true" />
          <span className="font-display ml-2 text-sm">
            Vidéo d&apos;exemple (sous-titrée) — à venir
          </span>
        </div>
      )}

      </div>

      <div className="mt-4 flex flex-col gap-3 lg:mt-0">
        {/* Sur mobile le guide reste repliable pour ne pas noyer l'écran ;
            en desktop la colonne existe pour ça, on l'affiche d'emblée. */}
        <button
          type="button"
          onClick={() => setGuideOpen((g) => !g)}
          aria-expanded={guideOpen}
          className="flex h-12 w-full items-center justify-between rounded-2xl border border-border bg-card px-3 lg:hidden"
        >
          <span className="font-display text-sm font-semibold">
            Guide d&apos;animation
          </span>
          <ChevronRight
            size={16}
            aria-hidden="true"
            className="motion-safe:transition-transform"
            style={{ transform: guideOpen ? "rotate(90deg)" : "none" }}
          />
        </button>

        <div className={guideOpen ? "surface" : "hidden surface lg:block"}>
          <p className="font-display mb-2 hidden text-sm font-semibold lg:block">
            Guide d&apos;animation
          </p>
          <ul lang={displayTranslation.lang} className="flex flex-col gap-2">
            {displayTranslation.key_points.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-success">✓</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button
          onClick={() => router.push(`/module/session?id=${module.id}`)}
          className="font-display h-12 w-full gap-2 text-base font-bold"
        >
          <Users size={18} aria-hidden="true" /> Animer une séance
        </Button>
      </div>
      </div>
    </div>
  );
}
