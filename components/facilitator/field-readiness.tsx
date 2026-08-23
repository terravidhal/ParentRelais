"use client";

import Link from "next/link";
import { CheckCircle2, CloudUpload, Download, Smartphone } from "lucide-react";

interface FieldReadinessProps {
  /** Séances animées mais pas encore remontées. */
  pendingCount: number;
  /** Médias annoncés par le contenu mais absents de l'appareil. */
  missingMediaCount: number;
  /** L'application tourne-t-elle en mode installé ? */
  installed: boolean;
  online: boolean;
}

/**
 * « Prêt pour le terrain ? » — la préparation avant de partir en zone sans
 * réseau.
 *
 * L'application faisait déjà tout le travail technique (précache, stockage
 * persistant, outbox), mais ne le DISAIT à personne : rien n'indiquait qu'il
 * fallait installer l'app, télécharger les vidéos ou synchroniser avant de
 * partir. Un facilitateur découvrait le problème en brousse, au pire moment.
 *
 * Volontairement silencieux quand tout est prêt : un bandeau permanent
 * deviendrait du bruit, et cesserait d'être lu le jour où il compte.
 */
export function FieldReadiness({
  pendingCount,
  missingMediaCount,
  installed,
  online,
}: FieldReadinessProps) {
  const items = [
    !installed && {
      key: "install",
      icon: Smartphone,
      label: "Installer l'application",
      detail:
        "Sans installation, l'app peut devenir inaccessible hors connexion.",
      href: "/profile",
      action: "Installer",
    },
    missingMediaCount > 0 && {
      key: "media",
      icon: Download,
      label: `${missingMediaCount} fichier${missingMediaCount > 1 ? "s" : ""} à télécharger`,
      detail:
        "Les vidéos ne sont pas téléchargées automatiquement : sans elles, les modules seront muets d'images.",
      href: "/downloads",
      action: "Télécharger",
    },
    pendingCount > 0 && {
      key: "sync",
      icon: CloudUpload,
      label: `${pendingCount} séance${pendingCount > 1 ? "s" : ""} à envoyer`,
      detail: online
        ? "Envoyez-les maintenant : hors réseau, elles resteront en attente."
        : "Elles partiront automatiquement au retour du réseau.",
      href: "/history",
      action: "Voir",
    },
  ].filter(Boolean) as {
    key: string;
    icon: typeof Smartphone;
    label: string;
    detail: string;
    href: string;
    action: string;
  }[];

  // L'ancre #field-readiness-title doit exister dans les DEUX états : le
  // guide d'accueil pointe dessus, et il sauterait l'étape si elle
  // disparaissait une fois tout en ordre.
  if (items.length === 0) {
    return (
      <div
        id="field-readiness-title"
        className="flex items-center gap-2 rounded-2xl border border-success/30 bg-success-soft px-3 py-2.5"
      >
        <CheckCircle2 size={16} className="shrink-0 text-success" aria-hidden="true" />
        <p className="text-sm font-semibold text-success">
          Prêt pour le terrain — tout est sur l&apos;appareil.
        </p>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="field-readiness-title"
      className="rounded-2xl border border-accent/40 bg-accent/10 p-3"
    >
      <h2
        id="field-readiness-title"
        className="font-display text-sm font-bold text-accent-ink"
      >
        Avant de partir en zone sans réseau
      </h2>
      <ul className="mt-2 flex flex-col gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className="flex items-center gap-2.5 rounded-xl bg-background p-2.5"
              >
                <Icon size={17} className="shrink-0 text-accent-ink" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {item.detail}
                  </span>
                </span>
                <span className="font-display shrink-0 text-sm font-semibold text-primary">
                  {item.action}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
