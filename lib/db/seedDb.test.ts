import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./dexie";
import { ensureSeeded } from "./seedDb";
import { SEED_MODULES } from "@/lib/content/seed";

describe("ensureSeeded", () => {
  beforeEach(async () => {
    await db.modules.clear();
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

  it("ne réinsère pas si des modules existent déjà (même différents du seed)", async () => {
    await db.modules.add({
      id: 99,
      position: 1,
      duration_min: 10,
      translations: [],
    });

    await ensureSeeded();

    const modules = await db.modules.toArray();
    expect(modules).toHaveLength(1);
    expect(modules[0].id).toBe(99);
  });
});
