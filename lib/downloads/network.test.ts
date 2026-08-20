import { describe, expect, it, afterEach, vi } from "vitest";
import { getNetworkQuality, shouldAutoDownload } from "./network";

/** Remplace navigator.connection le temps d'un test. */
function setConnection(value: Record<string, unknown> | undefined) {
  Object.defineProperty(navigator, "connection", {
    value,
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  setConnection(undefined);
  vi.restoreAllMocks();
});

describe("qualité du réseau", () => {
  it("traite l'économiseur de données comme un refus explicite", () => {
    // Prime sur la qualité du lien : c'est un choix de l'utilisateur.
    setConnection({ saveData: true, effectiveType: "4g" });
    expect(getNetworkQuality()).toBe("economie");
    expect(shouldAutoDownload()).toBe(false);
  });

  it("considère la 4G comme un lien rapide", () => {
    setConnection({ effectiveType: "4g", saveData: false });
    expect(getNetworkQuality()).toBe("rapide");
    expect(shouldAutoDownload()).toBe(true);
  });

  it("bloque le téléchargement automatique sur lien lent", () => {
    for (const t of ["slow-2g", "2g", "3g"]) {
      setConnection({ effectiveType: t, saveData: false });
      expect(getNetworkQuality(), t).toBe("lent");
      expect(shouldAutoDownload(), t).toBe(false);
    }
  });

  it("reconnaît le wifi quand le navigateur l'expose", () => {
    setConnection({ type: "wifi", saveData: false });
    expect(getNetworkQuality()).toBe("rapide");
  });

  it("n'empêche pas le téléchargement quand l'API est absente", () => {
    // Safari n'implémente pas l'API : bloquer par défaut rendrait la
    // fonctionnalité inutilisable sur iPhone.
    setConnection(undefined);
    expect(getNetworkQuality()).toBe("inconnu");
    expect(shouldAutoDownload()).toBe(true);
  });
});
