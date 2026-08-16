"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MEDIA_TYPE_BY_EXTENSION: Record<string, "audio" | "video" | "subtitles"> = {
  mp3: "audio",
  m4a: "audio",
  wav: "audio",
  mp4: "video",
  webm: "video",
  vtt: "subtitles",
};

const URL_COLUMN_BY_MEDIA_TYPE = {
  audio: "audio_url",
  video: "video_url",
  subtitles: "subtitles_url",
} as const;

interface MediaUploadCellProps {
  moduleId: number;
  lang: string;
}

/**
 * Uploade un fichier média pour une cellule (module × langue) donnée. Le
 * flip "pending"→"ready" repose sur une ligne module_translations
 * pré-existante pour (moduleId, lang) — un UPDATE sur zéro ligne réussit
 * silencieusement sans rien changer (voir
 * supabase/migrations/0011_seed_ff_sign_shell_rows.sql, qui garantit cette
 * ligne pour "ff" et "sign").
 */
export function MediaUploadCell({ moduleId, lang }: MediaUploadCellProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const mediaType = MEDIA_TYPE_BY_EXTENSION[extension];
    if (!mediaType) {
      setError("Format non reconnu (audio, vidéo ou .vtt attendu)");
      return;
    }

    setIsUploading(true);
    setError(null);

    const supabase = createClient();
    const path = `modules/${moduleId}/${lang}/${mediaType}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setIsUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("media").getPublicUrl(path);

    const urlColumn = URL_COLUMN_BY_MEDIA_TYPE[mediaType];
    const update: Partial<
      Record<(typeof URL_COLUMN_BY_MEDIA_TYPE)[typeof mediaType], string>
    > & { status: "ready" } = {
      [urlColumn]: publicUrl,
      status: "ready",
    };

    const { error: upsertError } = await supabase
      .from("module_translations")
      .update(update)
      .eq("module_id", moduleId)
      .eq("lang", lang);

    setIsUploading(false);

    if (upsertError) {
      setError(upsertError.message);
      return;
    }

    router.refresh();
  };

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
        aria-label={`Téléverser un fichier — module ${moduleId}, ${lang}`}
      >
        {isUploading ? (
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
        ) : (
          <Upload size={14} aria-hidden="true" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.m4a,.wav,.mp4,.webm,.vtt"
        onChange={handleFileChange}
        className="hidden"
      />
      {error && (
        <p role="alert" className="max-w-[90px] text-center text-[10px] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
