"use client";

import { useTransition } from "react";
import { Archive, ArchiveRestore, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  setModuleArchived,
  setModulePublication,
} from "@/app/(dashboard)/dashboard/content/actions";

interface ModulePublicationControlsProps {
  moduleId: number;
  published: boolean;
  archived: boolean;
  /** Langues encore vides — sert à prévenir avant une publication prématurée. */
  pendingLangs: string[];
}

/**
 * Publier / dépublier / archiver un module.
 *
 * Publier est l'unique geste qui envoie un module vers les téléphones ;
 * archiver l'en retire. L'archivage ne SUPPRIME jamais : les séances déjà
 * animées référencent module_id, et leur historique doit rester lisible.
 */
export function ModulePublicationControls({
  moduleId,
  published,
  archived,
  pendingLangs,
}: ModulePublicationControlsProps) {
  const [isPending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) => {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) toast.success(success);
      else toast.error("Action impossible", { description: result.error });
    });
  };

  const handlePublish = () => {
    // Prévenir sans interdire : un module peut légitimement être publié
    // avec des langues encore vides (le français suffit à animer), mais
    // l'admin doit le savoir plutôt que de le découvrir sur le terrain.
    if (!published && pendingLangs.length > 0) {
      toast.warning(`Publié avec ${pendingLangs.length} langue(s) encore vide(s)`, {
        description: `Manquant : ${pendingLangs.join(", ")}.`,
      });
    }
    run(
      () => setModulePublication(moduleId, !published),
      published ? "Module retiré du terrain" : "Module publié",
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={handlePublish}
        disabled={isPending || archived}
        className="flex h-11 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold disabled:opacity-50"
      >
        {published ? (
          <>
            <EyeOff size={14} aria-hidden="true" /> Dépublier
          </>
        ) : (
          <>
            <Eye size={14} aria-hidden="true" /> Publier
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() =>
          run(
            () => setModuleArchived(moduleId, !archived),
            archived ? "Module désarchivé" : "Module archivé",
          )
        }
        disabled={isPending}
        className="flex h-11 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold text-muted-foreground disabled:opacity-50"
      >
        {archived ? (
          <>
            <ArchiveRestore size={14} aria-hidden="true" /> Désarchiver
          </>
        ) : (
          <>
            <Archive size={14} aria-hidden="true" /> Archiver
          </>
        )}
      </button>
    </div>
  );
}
