"use client";

import { useQuery } from "@tanstack/react-query";
import { getPendingSessions } from "@/lib/db/outbox";

export function usePendingSessionsQuery() {
  return useQuery({
    queryKey: ["dexie", "outbox", "pending"],
    queryFn: getPendingSessions,
  });
}
