import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./dexie";
import { readFacilitatorSession, saveFacilitatorSession } from "./meta";

describe("facilitator session (meta)", () => {
  beforeEach(async () => {
    await db.meta.clear();
  });

  it("retourne null quand aucune session n'existe", async () => {
    const session = await readFacilitatorSession();
    expect(session).toBeNull();
  });

  it("sauvegarde puis relit exactement la même session", async () => {
    const original = {
      facilitator_id: "fac-1",
      full_name: "Aïcha Test",
      region: "Extrême-Nord",
      pin: "1234",
    };

    await saveFacilitatorSession(original);
    const read = await readFacilitatorSession();

    expect(read).toEqual(original);
  });

  it("écraser la session existante remplace bien l'ancienne valeur", async () => {
    await saveFacilitatorSession({
      facilitator_id: "fac-1",
      full_name: "Premier",
      region: "Extrême-Nord",
      pin: "1111",
    });
    await saveFacilitatorSession({
      facilitator_id: "fac-1",
      full_name: "Second",
      region: "Adamaoua",
      pin: "2222",
    });

    const read = await readFacilitatorSession();
    expect(read?.full_name).toBe("Second");
    expect(read?.pin).toBe("2222");
  });

  it("readFacilitatorSession renvoie null (pas d'exception) si le JSON stocké est corrompu", async () => {
    await db.meta.put({ key: "facilitator_session", value: "{not valid json" });

    const session = await readFacilitatorSession();
    expect(session).toBeNull();
  });
});
