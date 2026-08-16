import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./dexie";
import { ensureSeeded, forceContentReset } from "./seedDb";
import { SEED_MODULES, SEED_VERSION } from "@/lib/content/seed";

const SEED_VERSION_KEY = "seed_version";

describe("ensureSeeded", () => {
  beforeEach(async () => {
    await db.modules.clear();
    await db.meta.delete(SEED_VERSION_KEY);
  });

  it("peuple les modules quand la table est vide", async () => {
    await ensureSeeded();

    const modules = await db.modules.toArray();
    expect(modules).toHaveLength(SEED_MODULES.length);
  });

  it("est idempotent : un second appel ne duplique pas les modules", async () => {
    await ensureSeeded();
    await ensureSeeded();

    const modules = await db.modules.toArray();
    expect(modules).toHaveLength(SEED_MODULES.length);
  });

  it("ne réinsère pas si les modules existants sont déjà à jour (même version)", async () => {
    await ensureSeeded();
    await db.modules.update(SEED_MODULES[0].id, { duration_min: 999 });

    await ensureSeeded();

    const modules = await db.modules.toArray();
    expect(modules).toHaveLength(SEED_MODULES.length);
    expect(modules.find((m) => m.id === SEED_MODULES[0].id)?.duration_min).toBe(999);
  });

  it("resynchronise le contenu si la version stockée est périmée, sans toucher outbox ni la session", async () => {
    await db.modules.add({
      id: 99,
      position: 1,
      duration_min: 10,
      translations: [],
    });
    await db.meta.put({ key: SEED_VERSION_KEY, value: "0" });
    await db.outbox.add({
      client_uuid: "test-uuid",
      facilitator_id: "fac-1",
      module_id: 1,
      region: "Extrême-Nord",
      locality: "Maroua",
      parents_total: 5,
      women: 3,
      disability_count: 0,
      quiz_score: 1,
      quiz_max: 2,
      held_at: new Date().toISOString(),
      status: "pending",
    });
    await db.meta.put({
      key: "facilitator_session",
      value: JSON.stringify({
        facilitator_id: "fac-1",
        full_name: "Test",
        region: "Extrême-Nord",
        pin: "1234",
      }),
    });

    await ensureSeeded();

    const modules = await db.modules.toArray();
    expect(modules).toHaveLength(SEED_MODULES.length);
    expect(modules.find((m) => m.id === 99)).toBeUndefined();

    const storedVersion = await db.meta.get(SEED_VERSION_KEY);
    expect(storedVersion?.value).toBe(String(SEED_VERSION));

    const outboxSessions = await db.outbox.toArray();
    expect(outboxSessions).toHaveLength(1);
    expect(outboxSessions[0].client_uuid).toBe("test-uuid");

    const session = await db.meta.get("facilitator_session");
    expect(session?.value).toContain("fac-1");

    await db.outbox.clear();
    await db.meta.delete("facilitator_session");
  });
});

describe("forceContentReset", () => {
  beforeEach(async () => {
    await db.modules.clear();
    await db.meta.delete(SEED_VERSION_KEY);
  });

  it("réinitialise les modules sans toucher outbox", async () => {
    await ensureSeeded();
    await db.modules.update(SEED_MODULES[0].id, { duration_min: 1 });
    await db.outbox.add({
      client_uuid: "keep-me",
      facilitator_id: "fac-1",
      module_id: 1,
      region: "Extrême-Nord",
      locality: "Maroua",
      parents_total: 5,
      women: 3,
      disability_count: 0,
      quiz_score: 1,
      quiz_max: 2,
      held_at: new Date().toISOString(),
      status: "pending",
    });

    await forceContentReset();

    const modules = await db.modules.toArray();
    expect(
      modules.find((m) => m.id === SEED_MODULES[0].id)?.duration_min,
    ).toBe(SEED_MODULES[0].duration_min);

    const outboxSessions = await db.outbox.toArray();
    expect(outboxSessions).toHaveLength(1);
    expect(outboxSessions[0].client_uuid).toBe("keep-me");

    await db.outbox.clear();
  });
});
