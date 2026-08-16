import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db/dexie";
import { addOutboxSession } from "@/lib/db/outbox";
import { saveFacilitatorSession, clearFacilitatorSession } from "@/lib/db/meta";
import { syncOutbox } from "./engine";

/**
 * Mock générique : `from("sessions")` répond via `upsertImpl` (comme avant),
 * `from("facilitators")` répond succès par défaut — la plupart des tests
 * de séances ne portent pas sur l'identité facilitateur, mais syncOutbox
 * l'upsert désormais à chaque appel (voir lib/sync/engine.ts).
 */
function mockSupabase(
  upsertImpl: (rows: unknown[]) => { data: { client_uuid: string }[] | null; error: unknown },
) {
  const sessionsUpsert = vi.fn(upsertImpl);
  return {
    from: vi.fn((table: string) => {
      if (table === "facilitators") {
        return { upsert: vi.fn(() => Promise.resolve({ error: null })) };
      }
      return {
        upsert: vi.fn((rows: unknown[]) => {
          const result = sessionsUpsert(rows);
          return {
            select: vi.fn(() => Promise.resolve(result)),
          };
        }),
      };
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("syncOutbox", () => {
  beforeEach(async () => {
    await db.outbox.clear();
    await clearFacilitatorSession();
  });

  it("ne synchronise aucune séance si l'outbox est vide", async () => {
    const supabase = mockSupabase(() => ({ data: [], error: null }));

    const result = await syncOutbox(supabase);

    expect(result).toEqual({ syncedCount: 0, failedCount: 0 });
  });

  it("upsert l'identité facilitateur à chaque appel, indépendamment de l'outbox", async () => {
    await saveFacilitatorSession({
      facilitator_id: "fac-1",
      full_name: "Aïcha Test",
      region: "Extrême-Nord",
      pin: "1234",
    });
    const facilitatorsUpsert = vi.fn(() => Promise.resolve({ error: null }));
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "facilitators") {
          return { upsert: facilitatorsUpsert };
        }
        return {
          upsert: vi.fn(() => ({
            select: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        };
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    await syncOutbox(supabase);

    expect(facilitatorsUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        facilitator_id: "fac-1",
        full_name: "Aïcha Test",
        region: "Extrême-Nord",
      }),
      expect.objectContaining({ onConflict: "facilitator_id" }),
    );
  });

  it("un échec de l'upsert facilitateur ne bloque pas la synchro des séances", async () => {
    await saveFacilitatorSession({
      facilitator_id: "fac-1",
      full_name: "Aïcha Test",
      region: "Extrême-Nord",
      pin: "1234",
    });
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
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "facilitators") {
          return {
            upsert: vi.fn(() =>
              Promise.resolve({ error: { message: "facilitators write failed" } }),
            ),
          };
        }
        return {
          upsert: vi.fn(() => ({
            select: vi.fn(() =>
              Promise.resolve({ data: [{ client_uuid: uuid }], error: null }),
            ),
          })),
        };
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const result = await syncOutbox(supabase);

    expect(result).toEqual({ syncedCount: 1, failedCount: 0 });
    const stored = await db.outbox.get(uuid);
    expect(stored?.status).toBe("synced");
  });

  it("upsert les séances pending et les marque synced après confirmation serveur", async () => {
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

    const supabase = mockSupabase(() => ({
      data: [{ client_uuid: uuid }],
      error: null,
    }));

    const result = await syncOutbox(supabase);

    expect(result).toEqual({ syncedCount: 1, failedCount: 0 });
    const stored = await db.outbox.get(uuid);
    expect(stored?.status).toBe("synced");
  });

  it("ne marque RIEN synced si l'upsert Supabase échoue (pas de perte, pas de faux positif)", async () => {
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

    const supabase = mockSupabase(() => ({
      data: null,
      error: { message: "network down" },
    }));

    await expect(syncOutbox(supabase)).rejects.toThrow(
      "Synchronisation Supabase échouée",
    );

    const stored = await db.outbox.get(uuid);
    expect(stored?.status).toBe("pending");
  });

  it("appelle upsert avec onConflict sur client_uuid (idempotence)", async () => {
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

    const upsertMock = vi.fn(() => ({
      select: vi.fn(() =>
        Promise.resolve({ data: [{ client_uuid: uuid }], error: null }),
      ),
    }));
    const supabase = {
      from: vi.fn(() => ({ upsert: upsertMock })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    await syncOutbox(supabase);

    expect(upsertMock).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ onConflict: "client_uuid" }),
    );
  });

  it("une deuxième synchro rejouée sur une séance déjà synced ne la ré-envoie pas (elle n'est plus pending)", async () => {
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

    const supabase = mockSupabase(() => ({
      data: [{ client_uuid: uuid }],
      error: null,
    }));

    await syncOutbox(supabase);
    const secondResult = await syncOutbox(supabase);

    expect(secondResult).toEqual({ syncedCount: 0, failedCount: 0 });
  });
});
