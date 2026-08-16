import { FileText } from "lucide-react";

export interface MediaLibraryEntry {
  moduleId: number;
  lang: string;
  audioUrl: string | null;
  videoUrl: string | null;
  subtitlesUrl: string | null;
}

interface MediaLibraryListProps {
  entries: MediaLibraryEntry[];
}

const LANG_LABEL: Record<string, string> = {
  fr: "Français",
  en: "Anglais",
  ff: "Fulfulde",
  sign: "Langue des signes",
};

/**
 * Composant de présentation pure — reçoit les lignes déjà requêtées côté
 * serveur (voir app/(dashboard)/dashboard/content/media/page.tsx), aucune
 * dépendance Supabase ici.
 */
export function MediaLibraryList({ entries }: MediaLibraryListProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun média déposé pour l&apos;instant.
      </p>
    );
  }

  const byModule = new Map<number, MediaLibraryEntry[]>();
  for (const entry of entries) {
    const list = byModule.get(entry.moduleId) ?? [];
    list.push(entry);
    byModule.set(entry.moduleId, list);
  }

  return (
    <div className="flex flex-col gap-6">
      {[...byModule.entries()].map(([moduleId, moduleEntries]) => (
        <div key={moduleId}>
          <h3 className="font-display mb-2 text-sm font-bold">
            Module {moduleId}
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {moduleEntries.map((entry) => (
              <div
                key={entry.lang}
                className="rounded-2xl border border-border bg-background p-3"
              >
                <p className="mb-2 text-xs font-semibold text-muted-foreground">
                  {LANG_LABEL[entry.lang] ?? entry.lang}
                </p>
                <div className="flex flex-col gap-2">
                  {entry.audioUrl && (
                    <audio controls preload="metadata" className="h-10 w-full">
                      <source src={entry.audioUrl} />
                    </audio>
                  )}
                  {entry.videoUrl && (
                    <video
                      controls
                      preload="metadata"
                      className="w-full max-w-sm rounded-xl bg-foreground"
                    >
                      <source src={entry.videoUrl} />
                    </video>
                  )}
                  {entry.subtitlesUrl && (
                    <a
                      href={entry.subtitlesUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-11 w-fit items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold text-primary hover:bg-muted"
                    >
                      <FileText size={14} aria-hidden="true" />
                      Fichier .vtt
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
