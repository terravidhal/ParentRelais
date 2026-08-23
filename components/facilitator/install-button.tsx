"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Share, Check, MoreVertical } from "lucide-react";

/**
 * Événement non standardisé, absent de lib.dom.d.ts.
 * Chromium/Android l'émet quand l'app devient installable.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Bouton d'installation maison.
 *
 * Sans lui, l'installation dépend entièrement de la bannière spontanée du
 * navigateur : elle n'apparaît qu'une fois, et si l'utilisateur la manque ou
 * la refuse, Chrome ne la repropose pas avant plusieurs mois. C'est
 * exactement ce qui a été constaté en test réel — "elle m'a proposé de
 * l'installer, je n'ai pas pu, et après plus rien".
 *
 * On capte donc `beforeinstallprompt` pour rejouer la demande à la demande.
 * iOS/Safari n'implémente pas cette API : on y affiche les instructions
 * manuelles (Partager → Sur l'écran d'accueil), sinon le bouton serait
 * simplement absent sur iPhone sans explication.
 */
/** Lu une seule fois au premier rendu client : ces valeurs ne changent pas
 *  pendant la vie de la page (hors installation, gérée par `appinstalled`). */
function readStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari iOS expose l'état standalone hors standard.
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function readIsIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua);
}

export function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(readStandalone);
  const [isIOS] = useState(readIsIOS);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [showManualHelp, setShowManualHelp] = useState(false);

  useEffect(() => {
    if (installed) return;

    const onPrompt = (event: Event) => {
      // Empêche la mini-bannière automatique : c'est notre bouton qui pilote,
      // sinon la seule chance d'installer disparaît au premier refus.
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      // Le navigateur n'affiche AUCUN retour visible après l'installation :
      // constaté en test réel, l'utilisateur croit que rien ne s'est passé et
      // découvre l'icône par hasard plus tard.
      toast.success("Application installée", {
        description:
          "Vous la retrouverez avec vos autres applications, et elle fonctionnera sans réseau.",
      });
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [installed]);

  const handleInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    // Un prompt ne peut être rejoué qu'une fois : on le libère, le navigateur
    // en réémettra un nouveau si l'app reste installable.
    setDeferred(null);
    if (outcome === "accepted") setInstalled(true);
  };

  if (installed) {
    return (
      <p className="flex items-center gap-2 text-sm font-semibold text-success">
        <Check size={16} aria-hidden="true" />
        Application installée sur cet appareil
      </p>
    );
  }

  if (isIOS) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setShowIOSHelp((v) => !v)}
          aria-expanded={showIOSHelp}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-primary bg-primary/5 text-sm font-semibold text-primary"
        >
          <Download size={18} aria-hidden="true" />
          Installer l&apos;application
        </button>
        {showIOSHelp && (
          <ol className="mt-2 flex flex-col gap-1.5 rounded-2xl border border-border bg-background p-3 text-sm">
            <li className="flex items-center gap-2">
              <Share size={15} className="shrink-0 text-primary" aria-hidden="true" />
              Appuyez sur « Partager » en bas de Safari
            </li>
            <li>Choisissez « Sur l&apos;écran d&apos;accueil »</li>
            <li>Confirmez avec « Ajouter »</li>
          </ol>
        )}
      </div>
    );
  }

  // Sans prompt disponible, on affiche les instructions manuelles au lieu de
  // disparaître. `return null` laissait l'écran muet dans le cas le plus
  // fréquent : Chrome n'émet `beforeinstallprompt` qu'une fois par session
  // et jamais si l'utilisateur a déjà refusé. Constaté en test réel — « elle
  // m'a proposé de l'installer, je n'ai pas pu, et après plus rien ».
  if (!deferred) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setShowManualHelp((v) => !v)}
          aria-expanded={showManualHelp}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-primary bg-primary/5 text-sm font-semibold text-primary"
        >
          <Download size={18} aria-hidden="true" />
          Installer l&apos;application
        </button>
        {showManualHelp && (
          <ol className="mt-2 flex flex-col gap-1.5 rounded-2xl border border-border bg-background p-3 text-sm">
            <li className="flex items-center gap-2">
              <MoreVertical size={15} className="shrink-0 text-primary" aria-hidden="true" />
              Ouvrez le menu de votre navigateur (les trois points)
            </li>
            <li>Choisissez « Installer l&apos;application » ou « Ajouter à l&apos;écran d&apos;accueil »</li>
            <li>Confirmez</li>
          </ol>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleInstall}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground"
    >
      <Download size={18} aria-hidden="true" />
      Installer l&apos;application
    </button>
  );
}
