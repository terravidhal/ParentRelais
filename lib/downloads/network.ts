/**
 * Détection du type de réseau, pour ne pas consommer le forfait data d'un
 * facilitateur sans son accord.
 *
 * Inspiré du fonctionnement de YouTube offline : les téléchargements ne
 * partent que sur Wi-Fi par défaut, et s'arrêtent quand le stockage devient
 * faible. La transposition au web a une limite mesurée : `connection.type`
 * (qui distinguerait "wifi" de "cellular") renvoie `null` dans les
 * navigateurs testés. On se rabat sur `effectiveType`, qui décrit la QUALITÉ
 * du lien, pas sa nature — c'est une approximation, et l'interface le dit
 * honnêtement plutôt que de promettre une détection Wi-Fi qu'on n'a pas.
 */

interface NetworkInformation {
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  saveData?: boolean;
  type?: string;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

function getConnection(): NetworkInformation | null {
  if (typeof navigator === "undefined") return null;
  return (
    (navigator as Navigator & { connection?: NetworkInformation }).connection ?? null
  );
}

export type NetworkQuality = "rapide" | "lent" | "economie" | "inconnu";

export function getNetworkQuality(): NetworkQuality {
  const c = getConnection();
  if (!c) return "inconnu";
  // L'utilisateur a activé l'économiseur de données du système : c'est un
  // choix explicite, il prime sur la qualité mesurée du lien.
  if (c.saveData) return "economie";
  if (c.type === "wifi" || c.type === "ethernet") return "rapide";
  if (c.effectiveType === "4g") return "rapide";
  if (c.effectiveType) return "lent";
  return "inconnu";
}

/**
 * Un téléchargement automatique est-il raisonnable maintenant ?
 * Un lien lent ou l'économiseur de données actif bloquent l'automatique,
 * jamais une action lancée explicitement par l'utilisateur.
 */
export function shouldAutoDownload(): boolean {
  const q = getNetworkQuality();
  return q === "rapide" || q === "inconnu";
}

export function onNetworkQualityChange(cb: () => void): () => void {
  const c = getConnection();
  if (!c?.addEventListener) return () => {};
  c.addEventListener("change", cb);
  return () => c.removeEventListener?.("change", cb);
}
