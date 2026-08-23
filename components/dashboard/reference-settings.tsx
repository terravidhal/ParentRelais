"use client";

import { useRef, useState, useTransition } from "react";
import { Globe, MapPin, Plus, Power } from "lucide-react";
import { toast } from "sonner";
import {
  createLanguage,
  createLocality,
  createRegion,
  setLanguageActive,
} from "@/app/(dashboard)/dashboard/settings/actions";

export interface ReferenceLanguage {
  code: string;
  label: string;
  shortLabel: string;
  active: boolean;
}

export interface ReferenceRegion {
  id: number;
  name: string;
  localities: string[];
}

const INPUT_CLASS =
  "h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal";

/**
 * Administration du référentiel : langues, régions, localités.
 *
 * C'est ici que se tient la promesse de la landing — « ajouter une langue =
 * remplir une case ». Ces listes étaient auparavant codées en dur dans cinq
 * fichiers, et en ajouter une exigeait de modifier le code.
 */
export function ReferenceSettings({
  languages,
  regions,
}: {
  languages: ReferenceLanguage[];
  regions: ReferenceRegion[];
}) {
  const [isPending, startTransition] = useTransition();
  const [addingLang, setAddingLang] = useState(false);
  const [addingRegion, setAddingRegion] = useState(false);
  const [addingLocality, setAddingLocality] = useState<number | null>(null);
  const langFormRef = useRef<HTMLFormElement>(null);
  const regionFormRef = useRef<HTMLFormElement>(null);

  const run = (
    action: () => Promise<{ ok: boolean; error?: string }>,
    success: string,
    onDone?: () => void,
  ) => {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(success);
        onDone?.();
      } else {
        toast.error("Action impossible", { description: result.error });
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="surface-raised">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display flex items-center gap-2 font-bold">
            <Globe size={16} aria-hidden="true" /> Langues
          </h2>
          {!addingLang && (
            <button
              type="button"
              onClick={() => setAddingLang(true)}
              className="font-display flex h-11 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              <Plus size={15} aria-hidden="true" /> Ajouter une langue
            </button>
          )}
        </div>

        <p className="mb-3 text-sm text-muted-foreground">
          Une langue ajoutée ici apparaît aussitôt dans la matrice de contenu
          et sur les pastilles des facilitateurs. Ses cases de traduction sont
          créées pour tous les modules existants.
        </p>

        {addingLang && (
          <form
            ref={langFormRef}
            action={(fd) =>
              run(() => createLanguage(fd), "Langue ajoutée", () => {
                langFormRef.current?.reset();
                setAddingLang(false);
              })
            }
            className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-border p-3"
          >
            <label className="flex flex-col gap-1 text-xs font-semibold">
              Code
              <input
                name="code"
                required
                placeholder="ewo"
                className={`${INPUT_CLASS} w-24`}
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-xs font-semibold">
              Nom complet
              <input
                name="label"
                required
                placeholder="Ewondo"
                className={INPUT_CLASS}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold">
              Abréviation
              <input
                name="short_label"
                required
                placeholder="EWO"
                className={`${INPUT_CLASS} w-28`}
              />
            </label>
            <button
              type="submit"
              disabled={isPending}
              className="font-display h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {isPending ? "…" : "Ajouter"}
            </button>
            <button
              type="button"
              onClick={() => setAddingLang(false)}
              className="h-11 rounded-xl border border-border px-3 text-sm font-semibold"
            >
              Annuler
            </button>
          </form>
        )}

        <ul className="flex flex-col gap-2">
          {languages.map((l) => (
            <li
              key={l.code}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3"
            >
              <span>
                <span className="font-semibold">{l.label}</span>
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 font-mono text-xs">
                  {l.code}
                </span>
                {!l.active && (
                  <span className="ml-2 text-xs font-semibold text-muted-foreground">
                    désactivée
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() =>
                  run(
                    () => setLanguageActive(l.code, !l.active),
                    l.active ? "Langue désactivée" : "Langue réactivée",
                  )
                }
                disabled={isPending}
                className="flex h-11 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold disabled:opacity-50"
              >
                <Power size={14} aria-hidden="true" />
                {l.active ? "Désactiver" : "Réactiver"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="surface-raised">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display flex items-center gap-2 font-bold">
            <MapPin size={16} aria-hidden="true" /> Régions et localités
          </h2>
          {!addingRegion && (
            <button
              type="button"
              onClick={() => setAddingRegion(true)}
              className="font-display flex h-11 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              <Plus size={15} aria-hidden="true" /> Ajouter une région
            </button>
          )}
        </div>

        <p className="mb-3 text-sm text-muted-foreground">
          Les localités sont proposées au facilitateur quand il enregistre une
          séance, filtrées sur sa région.
        </p>

        {addingRegion && (
          <form
            ref={regionFormRef}
            action={(fd) =>
              run(() => createRegion(fd), "Région ajoutée", () => {
                regionFormRef.current?.reset();
                setAddingRegion(false);
              })
            }
            className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-border p-3"
          >
            <label className="flex flex-1 flex-col gap-1 text-xs font-semibold">
              Nom de la région
              <input
                name="name"
                required
                placeholder="Nord"
                className={INPUT_CLASS}
              />
            </label>
            <button
              type="submit"
              disabled={isPending}
              className="font-display h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {isPending ? "…" : "Ajouter"}
            </button>
            <button
              type="button"
              onClick={() => setAddingRegion(false)}
              className="h-11 rounded-xl border border-border px-3 text-sm font-semibold"
            >
              Annuler
            </button>
          </form>
        )}

        <ul className="flex flex-col gap-3">
          {regions.map((r) => (
            <li key={r.id} className="rounded-xl border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{r.name}</span>
                <button
                  type="button"
                  onClick={() =>
                    setAddingLocality(addingLocality === r.id ? null : r.id)
                  }
                  className="flex h-11 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold"
                >
                  <Plus size={14} aria-hidden="true" /> Localité
                </button>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                {r.localities.length > 0
                  ? r.localities.join(" · ")
                  : "Aucune localité — un facilitateur de cette région n'aurait rien à choisir."}
              </p>

              {addingLocality === r.id && (
                <form
                  action={(fd) =>
                    run(() => createLocality(fd), "Localité ajoutée", () =>
                      setAddingLocality(null),
                    )
                  }
                  className="mt-2 flex flex-wrap items-end gap-2"
                >
                  <input type="hidden" name="region_id" value={r.id} />
                  <label className="flex flex-1 flex-col gap-1 text-xs font-semibold">
                    Nom de la localité
                    <input
                      name="name"
                      required
                      placeholder="Garoua"
                      className={INPUT_CLASS}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="font-display h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {isPending ? "…" : "Ajouter"}
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
