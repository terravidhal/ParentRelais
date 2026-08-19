"use client";

import { useRef, useState } from "react";
import { RotateCcw, Upload } from "lucide-react";
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
  const [fileName, setFileName] = useState<string | null>(null);

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
    setFileName(file.name);

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

    setFileName(null);
    router.refresh();
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-accent hover:text-accent-ink disabled:opacity-50"
        aria-label={
          error
            ? `Réessayer l'envoi — module ${moduleId}, ${lang}`
            : `Téléverser un fichier — module ${moduleId}, ${lang}`
        }
      >
        {error ? (
          <RotateCcw size={16} aria-hidden="true" />
        ) : (
          <Upload size={16} aria-hidden="true" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.m4a,.wav,.mp4,.webm,.vtt"
        onChange={handleFileChange}
        className="hidden"
      />
      {isUploading && (
        <div className="w-[80px]">
          <p className="truncate text-center text-[11px] text-muted-foreground" title={fileName ?? undefined}>
            {fileName}
          </p>
          {/* Progression indéterminée honnête : le SDK Supabase Storage
              n'expose pas de callback onUploadProgress — mieux vaut une
              animation franchement indéterminée qu'un pourcentage inventé. */}
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/3 rounded-full bg-accent motion-safe:animate-pulse" />
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="max-w-[140px] text-center text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
