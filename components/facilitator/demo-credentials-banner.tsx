"use client";

import { KeyRound } from "lucide-react";

interface DemoCredentialsBannerProps {
  email: string;
  password: string;
  onFill: () => void;
}

/**
 * Identifiants de démonstration, affichés en clair.
 *
 * Choix assumé (voir 14-PLAN-FONDATIONS.md, 1.0quater) : le dossier de
 * candidature est déjà déposé et ne transmet que deux liens — le dépôt
 * GitHub et le déploiement. Ces surfaces sont donc le seul canal pour donner
 * des identifiants au jury, et des identifiants introuvables rendraient
 * l'application intestable.
 *
 * Le risque reste mesuré : aucune donnée personnelle de bénéficiaire n'est
 * stockée, et un compte de démonstration ne voit que ses propres séances.
 *
 * Le bouton de pré-remplissage évite au juré de recopier quoi que ce soit.
 */
export function DemoCredentialsBanner({
  email,
  password,
  onFill,
}: DemoCredentialsBannerProps) {
  return (
    <div className="rounded-xl border border-accent/40 bg-accent/10 p-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-accent-ink">
        <KeyRound size={16} aria-hidden="true" />
        Compte de démonstration
      </p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
        <dt className="text-muted-foreground">Email</dt>
        <dd className="font-mono font-semibold break-all">{email}</dd>
        <dt className="text-muted-foreground">Mot de passe</dt>
        <dd className="font-mono font-semibold break-all">{password}</dd>
      </dl>
      <button
        type="button"
        onClick={onFill}
        className="font-display mt-2.5 flex h-11 w-full items-center justify-center rounded-xl bg-accent text-sm font-semibold text-accent-foreground"
      >
        Remplir automatiquement
      </button>
    </div>
  );
}
