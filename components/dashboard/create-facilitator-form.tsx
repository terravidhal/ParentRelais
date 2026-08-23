"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { Copy, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { createFacilitatorAccount } from "@/app/(dashboard)/dashboard/facilitators/actions";

const REGIONS = ["Extrême-Nord", "Adamaoua", "Nord-Ouest", "Nord", "Centre"];

/**
 * Création d'un compte facilitateur par l'admin.
 *
 * Jamais d'inscription libre : sinon n'importe qui se déclare facilitateur
 * et pousse des données dans les statistiques du programme. C'est aussi la
 * pratique de KoboToolbox, référence du secteur humanitaire.
 */
export function CreateFacilitatorForm({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [lastEmail, setLastEmail] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (formData: FormData) => {
    setLastEmail(String(formData.get("email") ?? ""));
    startTransition(async () => {
      const result = await createFacilitatorAccount(formData);
      if (!result.ok) {
        toast.error("Création impossible", { description: result.error });
        return;
      }

      if (result.temporaryPassword) {
        // Affiché de façon persistante, pas dans un toast : c'est la SEULE
        // fois où ce mot de passe est lisible, et l'admin doit pouvoir le
        // transmettre avant de fermer.
        setTempPassword(result.temporaryPassword);
        toast.success("Compte créé", {
          description: "Transmettez le mot de passe provisoire au facilitateur.",
        });
      } else {
        toast.success("Invitation envoyée", {
          description: "Le facilitateur définira son mot de passe par email.",
        });
        setOpen(false);
      }
      formRef.current?.reset();
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>{children}</div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="font-display flex h-11 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            <Plus size={16} aria-hidden="true" />
            Nouveau facilitateur
          </button>
        )}
      </div>

      {tempPassword && (
        <div className="mt-4 rounded-xl border border-accent/40 bg-accent/10 p-4">
          <p className="font-display font-bold text-accent-ink">
            Mot de passe provisoire — notez-le maintenant
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Il ne sera plus affiché. Transmettez-le à {lastEmail} avec son
            adresse email.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="rounded-lg bg-background px-3 py-2 font-mono text-base font-bold tracking-wider">
              {tempPassword}
            </code>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(tempPassword);
                toast.success("Copié");
              }}
              className="flex h-11 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold"
            >
              <Copy size={14} aria-hidden="true" /> Copier
            </button>
            <button
              type="button"
              onClick={() => {
                setTempPassword(null);
                setOpen(false);
              }}
              className="flex h-11 items-center rounded-xl px-3 text-sm font-semibold text-muted-foreground"
            >
              J&apos;ai noté
            </button>
          </div>
        </div>
      )}

      {open && !tempPassword && (
        <form
          ref={formRef}
          action={handleSubmit}
          className="surface-raised mt-4 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold">Nouveau facilitateur</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Annuler"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Nom complet
            <input
              name="full_name"
              required
              maxLength={120}
              placeholder="Aïcha Bouba"
              className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Email
            <input
              name="email"
              type="email"
              required
              placeholder="aicha@exemple.org"
              className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-semibold">
            Région
            <select
              name="region"
              required
              className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal"
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          {/* Deux chemins délibérés : tous les facilitateurs de terrain n'ont
              pas d'adresse email accessible. */}
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="send_invite"
              defaultChecked
              className="mt-1 h-5 w-5"
            />
            <span>
              <span className="font-semibold">Envoyer une invitation par email</span>
              <span className="block text-xs text-muted-foreground">
                Le facilitateur choisit son mot de passe. Décochez si la
                personne n&apos;a pas d&apos;email accessible : un mot de passe
                provisoire sera généré.
              </span>
            </span>
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="font-display h-11 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {isPending ? "Création…" : "Créer le compte"}
          </button>
        </form>
      )}
    </>
  );
}
