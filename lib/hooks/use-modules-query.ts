"use client";

import { useQuery } from "@tanstack/react-query";
import { db, type CachedModule } from "@/lib/db/dexie";

export function useModulesQuery() {
  return useQuery<CachedModule[]>({
    queryKey: ["dexie", "modules"],
    queryFn: async () => {
      try {
        return await db.modules.orderBy("position").toArray();
      } catch (error: unknown) {
        throw new Error("Lecture Dexie des modules échouée", {
          cause: error,
        });
      }
    },
  });
}

export function useModuleQuery(id: number) {
  return useQuery<CachedModule | undefined>({
    queryKey: ["dexie", "modules", id],
    queryFn: async () => {
      try {
        return await db.modules.get(id);
      } catch (error: unknown) {
        throw new Error("Lecture Dexie du module échouée", { cause: error });
      }
    },
  });
}
