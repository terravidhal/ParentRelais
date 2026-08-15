import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./dexie";
import { addOutboxSession, getPendingSessions, markSessionsSynced } from "./outbox";

describe("outbox", () => {
  beforeEach(async () => {
    await db.outbox.clear();
  });

  it("écrit une séance en pending avec un client_uuid généré", async () => {
    const uuid = await addOutboxSession({
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

    expect(uuid).toMatch(/^[0-9a-f-]{36}$/);
    const stored = await db.outbox.get(uuid);
    expect(stored?.status).toBe("pending");
  });

  it("getPendingSessions ne retourne que les séances pending", async () => {
    const uuid1 = await addOutboxSession(sampleSession());
    const uuid2 = await addOutboxSession(sampleSession());
    await markSessionsSynced([uuid1]);

    const pending = await getPendingSessions();

    expect(pending).toHaveLength(1);
    expect(pending[0].client_uuid).toBe(uuid2);
  });

  it("markSessionsSynced ne supprime pas la séance, change juste son statut", async () => {
    const uuid = await addOutboxSession(sampleSession());
    await markSessionsSynced([uuid]);

    const stored = await db.outbox.get(uuid);
    expect(stored).toBeDefined();
    expect(stored?.status).toBe("synced");
  });

  it("markSessionsSynced sur une liste vide ne fait rien (pas d'erreur)", async () => {
    await expect(markSessionsSynced([])).resolves.toBeUndefined();
  });
});

function sampleSession() {
  return {
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
  };
}
