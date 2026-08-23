"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Download,
  FileText,
  Loader2,
  Pause,
  Play,
  Trash2,
} from "lucide-react";
import {
  MEDIA_LABEL,
  type ModuleDownloadStatus,
  type ModuleMediaEntry,
} from "@/lib/downloads/module-status";

interface ModuleDownloadCardProps {
  status: ModuleDownloadStatus;
  formatBytes: (bytes: number) => string;
  onDownload: (entries: ModuleMediaEntry[]) => void;
  onPause: (mediaUrl: string) => void;
  onResume: (mediaUrl: string) => void;
  onDelete: (mediaUrl: string) => void;
  busy: boolean;
}

/**
 * Disponibilité hors-ligne d'UN module.
 *
 * Le facilitateur raisonne en modules, pas en fichiers : il se demande si
 * telle séance est animable sans réseau, pas s'il possède `video-1-fr.mp4`.
 * L'action principale porte donc sur le module entier, et le détail par
 * média reste accessible en dépliant — pour qui veut l'audio sans les 15 Mo
 * de vidéo, cas réel sur un forfait limité.
 */
export function ModuleDownloadCard({
  status,
  formatBytes,
  onDownload,
  onPause,
  onResume,
  onDelete,
  busy,
}: ModuleDownloadCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { availability, entries, missing, title, module } = status;

  const badge = {
    complet: {
      icon: CheckCircle2,
      label: "Disponible hors-ligne",
      className: "bg-success-soft text-success",
    },
    partiel: {
      icon: CircleAlert,
      label: "Incomplet",
      className: "bg-accent/15 text-accent-ink",
    },
    absent: {
      icon: Download,
      label: "Non téléchargé",
      className: "bg-muted text-muted-foreground",
    },
    "sans-media": {
      icon: FileText,
      label: "Texte seul",
      className: "bg-muted text-muted-foreground",
    },
    "en-cours": {
      icon: Loader2,
      label: "En cours",
      className: "bg-primary/10 text-primary",
    },
  }[availability];

  const BadgeIcon = badge.icon;
  const paused = entries.some((e) => e.download?.status === "paused");
  const downloading = entries.find((e) => e.download?.status === "downloading");
  const missingBytes = missing.reduce(
    (sum, e) => sum + (e.download?.total_bytes ?? 0),
    0,
  );

  return (
    <li className="rounded-2xl border border-border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold">
            <span className="text-muted-foreground">M{module.id}</span> {title}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${badge.className}`}
            >
              <BadgeIcon
                size={12}
                aria-hidden="true"
                className={availability === "en-cours" ? "motion-safe:animate-spin" : ""}
              />
              {badge.label}
            </span>
            <span className="text-muted-foreground">
              {availability === "sans-media"
                ? "Aucun média pour cette langue"
                : `${entries.length} fichier${entries.length > 1 ? "s" : ""}`}
              {missingBytes > 0 && ` · ${formatBytes(missingBytes)} à récupérer`}
            </span>
          </p>
        </div>

        {/* Action principale : le module entier, pas fichier par fichier. */}
        {availability === "absent" || availability === "partiel" ? (
          <button
            type="button"
            onClick={() => onDownload(missing)}
            disabled={busy}
            className="font-display flex h-11 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            <Download size={15} aria-hidden="true" />
            {availability === "partiel" ? "Compléter" : "Télécharger"}
          </button>
        ) : availability === "en-cours" ? (
          <button
            type="button"
            onClick={() => {
              const target = downloading ?? entries.find((e) => e.download?.status === "paused");
              if (!target) return;
              if (paused && !downloading) onResume(target.media_url);
              else onPause(target.media_url);
            }}
            disabled={busy}
            className="flex h-11 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold disabled:opacity-50"
          >
            {paused && !downloading ? (
              <>
                <Play size={15} aria-hidden="true" /> Reprendre
              </>
            ) : (
              <>
                <Pause size={15} aria-hidden="true" /> Pause
              </>
            )}
          </button>
        ) : null}
      </div>

      {availability === "en-cours" && status.totalBytes > 0 && (
        <div className="mt-2">
          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={status.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Téléchargement de ${title}`}
          >
            <div
              className="h-full rounded-full bg-primary motion-safe:transition-all"
              style={{ width: `${status.percent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatBytes(status.downloadedBytes)} / {formatBytes(status.totalBytes)}{" "}
            · {status.percent} %
          </p>
        </div>
      )}

      {entries.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="mt-2 flex h-11 items-center gap-1 text-xs font-semibold text-muted-foreground"
          >
            <ChevronDown
              size={14}
              aria-hidden="true"
              className={expanded ? "rotate-180" : ""}
            />
            {expanded ? "Masquer le détail" : "Voir le détail des fichiers"}
          </button>

          {expanded && (
            <ul className="mt-1 flex flex-col gap-1.5">
              {entries.map((entry) => (
                <li
                  key={entry.media_url}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/40 px-2.5 py-2 text-xs"
                >
                  <span className="flex items-center gap-1.5">
                    {entry.available ? (
                      <CheckCircle2 size={13} className="text-success" aria-hidden="true" />
                    ) : (
                      <Download size={13} className="text-muted-foreground" aria-hidden="true" />
                    )}
                    <span className="font-semibold">
                      {MEDIA_LABEL[entry.media_type]}
                    </span>
                    {entry.download?.total_bytes ? (
                      <span className="text-muted-foreground">
                        {formatBytes(entry.download.total_bytes)}
                      </span>
                    ) : null}
                  </span>

                  {entry.available ? (
                    <button
                      type="button"
                      onClick={() => onDelete(entry.media_url)}
                      disabled={busy}
                      className="flex h-11 items-center gap-1 rounded-lg px-2 font-semibold text-destructive disabled:opacity-50"
                    >
                      <Trash2 size={13} aria-hidden="true" /> Supprimer
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onDownload([entry])}
                      disabled={busy}
                      className="flex h-11 items-center gap-1 rounded-lg px-2 font-semibold text-primary disabled:opacity-50"
                    >
                      <Download size={13} aria-hidden="true" /> Télécharger
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </li>
  );
}
