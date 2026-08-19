"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllDownloads } from "@/lib/db/downloads";
import {
  cancelDownload,
  deleteDownloadedMedia,
  getStorageEstimate,
  pauseAllDownloads,
  pauseDownload,
  queueDownload,
  resumeAllPaused,
  retryAllFailed,
  retryDownload,
} from "@/lib/downloads/manager";
import type { NewMediaDownload } from "@/lib/db/downloads";
import type { MediaDownload } from "@/lib/db/dexie";

const QUERY_KEY = ["dexie", "downloads"];

export function useMediaDownloadsQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getAllDownloads,
    // Un téléchargement progresse hors des actions utilisateur : on
    // rafraîchit pendant qu'il y a du travail, et on s'arrête sinon.
    // Interroger IndexedDB chaque seconde en permanence était inutile et
    // pénalisant sur téléphone modeste.
    refetchInterval: (query) => {
      const rows = query.state.data as MediaDownload[] | undefined;
      if (!rows) return false;
      const busy = rows.some(
        (d) => d.status === "downloading" || d.status === "queued",
      );
      return busy ? 700 : false;
    },
  });
}

export function useStorageEstimateQuery() {
  return useQuery({
    queryKey: ["storage", "estimate"],
    queryFn: getStorageEstimate,
    staleTime: 30_000,
  });
}

function useDownloadMutation<T>(fn: (arg: T) => Promise<void> | void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (arg: T) => {
      await fn(arg);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["storage", "estimate"] });
    },
  });
}

export function useQueueDownloadMutation() {
  return useDownloadMutation<NewMediaDownload>(queueDownload);
}

export function usePauseDownloadMutation() {
  return useDownloadMutation<string>(pauseDownload);
}

export function useRetryDownloadMutation() {
  return useDownloadMutation<string>(retryDownload);
}

export function useCancelDownloadMutation() {
  return useDownloadMutation<string>(cancelDownload);
}

export function useDeleteDownloadedMediaMutation() {
  return useDownloadMutation<string>(deleteDownloadedMedia);
}

export function usePauseAllMutation() {
  return useDownloadMutation<void>(pauseAllDownloads);
}

export function useResumeAllMutation() {
  return useDownloadMutation<void>(resumeAllPaused);
}

export function useRetryAllFailedMutation() {
  return useDownloadMutation<void>(retryAllFailed);
}
