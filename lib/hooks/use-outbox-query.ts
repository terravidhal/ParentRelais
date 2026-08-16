"use client";

import { useQuery } from "@tanstack/react-query";
import { getAllSessions, getPendingSessions } from "@/lib/db/outbox";

export function usePendingSessionsQuery() {
  return useQuery({
    queryKey: ["dexie", "outbox", "pending"],
    queryFn: getPendingSessions,
  });
}

export function useAllSessionsQuery() {
  return useQuery({
    queryKey: ["dexie", "outbox", "all"],
    queryFn: getAllSessions,
  });
}
