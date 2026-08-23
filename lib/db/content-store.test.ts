import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./dexie";
import type { CachedModule } from "./dexie";
import {
  clearLocalContent,
  hasLocalContent,
  readContentSyncedAt,
  replaceModules,
} from "./content-store";
import { addOutboxSession, getPendingSessions } from "./outbox";

function makeModule(id: number, title: string): CachedModule {
  return {
    id,
    position: id,
    duration_min: 45,
    translations: [
      {
        lang: "fr",
        title,
        summary: "résumé",
        key_points: [],
        status: "ready",
      },
    ],
  };
}

describe("content-store", () => {
  beforeEach(async () => {
    await db.modules.clear();
    await db.outbox.clear();
    await db.meta.clear();
  });

  it("écrit le catalogue reçu et horodate la mise à jour", async () => {
    await replaceModules([makeModule(1, "Perception de l'enfance")]);

    const modules = await db.modules.toArray();
    expect(modules).toHaveLength(1);
    expect(modules[0].translations[0].title).toBe("Perception de l'enfance");

    const syncedAt = await readContentSyncedAt();
    expect(syncedAt).toBeInstanceOf(Date);
  });

  it("remplace l'ancien catalogue au lieu de le compléter", async () => {
    await replaceModules([makeModule(1, "Ancien"), makeModule(2, "Ancien 2")]);
    await replaceModules([makeModule(3, "Nouveau")]);

    const modules = await db.modules.toArray();
    expect(modules.map((m) => m.id)).toEqual([3]);
  });

  it("ignore un catalogue vide plutôt que de vider l'app", async () => {
    await replaceModules([makeModule(1, "Existant")]);
    await replaceModules([]);

    expect(await db.modules.count()).toBe(1);
  });

  // CLAUDE.md règle 4 : la synchro ne perd jamais de données. Une descente
  // de contenu ne doit sous aucun prétexte emporter des séances animées mais
  // pas encore remontées.
  it("ne touche jamais aux séances en attente", async () => {
    await addOutboxSession({
      facilitator_id: "fac-1",
      module_id: 1,
      region: "Extrême-Nord",
      locality: "Maroua",
      parents_total: 10,
      women: 6,
      disability_count: 1,
      quiz_score: 2,
      quiz_max: 2,
      held_at: new Date().toISOString(),
    });

    await replaceModules([makeModule(9, "Contenu tout neuf")]);
    expect(await getPendingSessions()).toHaveLength(1);

    await clearLocalContent();
    expect(await getPendingSessions()).toHaveLength(1);
  });

  it("clearLocalContent vide le catalogue et la date de fraîcheur", async () => {
    await replaceModules([makeModule(1, "Existant")]);
    await clearLocalContent();

    expect(await hasLocalContent()).toBe(false);
    expect(await readContentSyncedAt()).toBeNull();
  });
});
