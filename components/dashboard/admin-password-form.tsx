"use client";

import { useRef, useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

/**
 * Changement de mot de passe depuis le compte connecté.
 *
 * Complète le lien de réinitialisation par email, qui reste inutilisable
 * pour les comptes de démonstration : Supabase rejette les adresses dont le
 * domaine n'existe pas (`email_address_invalid`, vérifié). Ce chemin-ci ne
 * dépend d'aucun envoi.
 */
export function AdminPasswordForm() {
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");

    if (password.length < 8) {
      toast.error("Mot de passe trop court", {
        description: "Il doit contenir au moins 8 caractères.",
      });
      return;
    }
    // Vérifié ici et pas seulement au serveur : une faute de frappe sur un
    // mot de passe masqué est invisible, et enfermerait la personne dehors.
    if (password !== confirmation) {
      toast.error("Les deux mots de passe diffèrent");
      return;
    }

    setPending(true);
    try {
      const { error } = await createClient().auth.updateUser({ password });
      if (error) {
        toast.error("Modification impossible", { description: error.message });
        return;
      }
      toast.success("Mot de passe modifié");
      formRef.current?.reset();
    } catch {
      toast.error("Modification impossible", {
        description: "Vérifiez votre connexion et réessayez.",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="surface-raised">
      <h2 className="font-display mb-1 flex items-center gap-2 font-bold">
        <KeyRound size={16} aria-hidden="true" /> Mot de passe
      </h2>
      <p className="mb-3 text-sm text-muted-foreground">
        Au moins 8 caractères. Vous resterez connecté après le changement.
      </p>

      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Nouveau mot de passe
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Confirmer
          <input
            name="confirmation"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm font-normal"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="font-display h-11 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Modification…" : "Modifier le mot de passe"}
        </button>
      </form>
    </section>
  );
}
