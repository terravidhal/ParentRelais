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
    return <p className="text-sm text-muted-foreground">Module introuvable.</p>;
  }

  const translation =
    module.translations.find((t) => t.lang === lang) ??
    module.translations.find((t) => t.lang === "fr")!;
  const isPending = translation.status === "pending";
  const displayTranslation = isPending
    ? module.translations.find((t) => t.lang === "fr")!
    : translation;

  return (
    <div>
      <button
        type="button"
        onClick={() => router.push("/")}
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
        />
      </div>

      <div lang={displayTranslation.lang}>
        <h2 className="font-display mt-2 text-xl font-bold">
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

      <button
        type="button"
        onClick={() => setGuideOpen((g) => !g)}
        className="mt-3 flex h-11 w-full items-center justify-between rounded-2xl border border-border bg-background px-3"
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
      {guideOpen && (
        <ul lang={displayTranslation.lang} className="mt-2 flex flex-col gap-2">
          {displayTranslation.key_points.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 text-success">✓</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}

      <Button
        onClick={() => router.push(`/modules/${module.id}/session`)}
        className="font-display mt-5 h-11 w-full gap-2 font-bold"
      >
        <Users size={18} aria-hidden="true" /> Animer une séance
      </Button>
    </div>
  );
}
