"use client";

import { useRef, useState } from "react";
import { RotateCcw, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  // Progression réelle en pourcentage, alimentée par XMLHttpRequest.
  const [progress, setProgress] = useState(0);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  /**
   * Traduit les erreurs Supabase en messages exploitables.
   *
   * Le message brut affiché jusqu'ici — « new row violates row-level
   * security policy » — ne dit rien à un coordinateur de programme et ne
   * lui indique aucune action.
   */
  const describeError = (message: string): string => {
    const m = message.toLowerCase();
    if (m.includes("row-level security") || m.includes("unauthorized")) {
      return "Vous n'avez pas les droits pour déposer un fichier. Vérifiez que votre compte est bien administrateur.";
    }
    if (m.includes("payload too large") || m.includes("exceeded")) {
      return "Fichier trop volumineux pour le serveur. Réduisez sa taille puis réessayez.";
    }
    if (m.includes("mime") || m.includes("content-type")) {
      return "Type de fichier refusé par le serveur.";
    }
    if (m.includes("failed to fetch") || m.includes("network")) {
      return "Connexion interrompue pendant l'envoi. Réessayez.";
    }
    return `Envoi impossible : ${message}`;
  };

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
    const fileNameForToast = file.name;

    setProgress(0);
    const supabase = createClient();
    const path = `modules/${moduleId}/${lang}/${mediaType}.${extension}`;

    // URL signée + XMLHttpRequest : c'est le seul moyen d'obtenir une VRAIE
    // progression. `storage.upload()` du SDK n'expose aucun callback, d'où
    // l'ancienne barre animée qui ne bougeait jamais — elle donnait
    // l'impression d'un envoi figé.
    const { data: signed, error: signedError } = await supabase.storage
      .from("media")
      .createSignedUploadUrl(path, { upsert: true });

    if (signedError || !signed) {
      setError(describeError(signedError?.message ?? "URL d'envoi indisponible"));
      setIsUploading(false);
      return;
    }

    const uploadError = await new Promise<string | null>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.open("PUT", signed.signedUrl, true);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.setRequestHeader("x-upsert", "true");

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          setProgress(Math.round((ev.loaded / ev.total) * 100));
        }
      };
      xhr.onload = () =>
        resolve(
          xhr.status >= 200 && xhr.status < 300
            ? null
            : `${xhr.status} ${xhr.responseText.slice(0, 120)}`,
        );
      xhr.onerror = () => resolve("network");
      xhr.onabort = () => resolve("__annule__");
      xhr.send(file);
    });

    xhrRef.current = null;

    // Annulation demandée : on sort sans message d'erreur, ce n'est pas un échec.
    if (uploadError === "__annule__") {
      setIsUploading(false);
      setFileName(null);
      setProgress(0);
      return;
    }

    if (uploadError) {
      setError(describeError(uploadError));
      setIsUploading(false);
      toast.error(`Envoi échoué — module ${moduleId}, ${lang}`);
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
      // Le fichier est bien dans Storage, seule la ligne de suivi a échoué.
      setError(
        `Fichier envoyé, mais la fiche n'a pas été mise à jour : ${upsertError.message}`,
      );
      return;
    }

    // Le toast porte la confirmation. Un état "Déposé" local avait été
    // essayé, mais router.refresh() remonte le composant et l'efface avant
    // qu'il soit lu — le toast, lui, survit au rafraîchissement.
    toast.success(`Fichier déposé — module ${moduleId}, ${lang}`, {
      description: fileNameForToast,
    });
    setFileName(null);
    setProgress(0);
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
        <div className="w-[92px]">
          <p
            className="truncate text-center text-[11px] text-muted-foreground"
            title={fileName ?? undefined}
          >
            {fileName}
          </p>
          {/* Progression réelle : XMLHttpRequest.upload.onprogress donne le
              rapport octets envoyés / total. */}
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-accent motion-safe:transition-all"
              style={{ width: `${Math.max(progress, 2)}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-center gap-1.5">
            <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
              {progress}&nbsp;%
            </span>
            <button
              type="button"
              onClick={() => xhrRef.current?.abort()}
              aria-label={`Annuler l'envoi — module ${moduleId}, ${lang}`}
              className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-destructive"
            >
              <X size={12} aria-hidden="true" />
            </button>
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
