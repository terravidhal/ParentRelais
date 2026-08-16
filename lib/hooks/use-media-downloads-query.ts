"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllDownloads } from "@/lib/db/downloads";
import {
  cancelDownload,
  pauseDownload,
  queueDownload,
  retryDownload,
} from "@/lib/downloads/manager";
import type { NewMediaDownload } from "@/lib/db/downloads";

const QUERY_KEY = ["dexie", "downloads"];

export function useMediaDownloadsQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getAllDownloads,
    // Une file de téléchargement progresse en dehors des actions utilisateur
    // (chunks reçus en arrière-plan) — un court intervalle de refetch reflète
    // la progression sans dépendre d'un canal de mise à jour dédié.
    refetchInterval: 1000,
  });
}

export function useQueueDownloadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: NewMediaDownload) => queueDownload(item),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function usePauseDownloadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (media_url: string) => {
      pauseDownload(media_url);
      return Promise.resolve();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useRetryDownloadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (media_url: string) => retryDownload(media_url),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useCancelDownloadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (media_url: string) => cancelDownload(media_url),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
