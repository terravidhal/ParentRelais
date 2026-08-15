import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db/dexie";
import { addOutboxSession } from "@/lib/db/outbox";
import { syncOutbox } from "./engine";

function mockSupabase(
  upsertImpl: (rows: unknown[]) => { data: { client_uuid: string }[] | null; error: unknown },
) {
  const upsert = vi.fn(upsertImpl);
  return {
    from: vi.fn(() => ({
      upsert: vi.fn((rows: unknown[]) => {
        const result = upsert(rows);
        return {
          select: vi.fn(() => Promise.resolve(result)),
        };
      }),
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("syncOutbox", () => {
  beforeEach(async () => {
    await db.outbox.clear();
  });

  it("ne fait rien si l'outbox est vide", async () => {
    const supabase = mockSupabase(() => ({ data: [], error: null }));

    const result = await syncOutbox(supabase);

    expect(result).toEqual({ syncedCount: 0, failedCount: 0 });
    expect(supabase.from).not.toHaveBeenCalled();
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
