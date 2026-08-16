"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { markOnboardingSeen, readOnboardingSeen } from "@/lib/db/meta";

const ONBOARDING_QUERY_KEY = ["dexie", "meta", "onboarding_seen"];

export function useOnboardingSeenQuery() {
  return useQuery({
    queryKey: ONBOARDING_QUERY_KEY,
    queryFn: readOnboardingSeen,
  });
}

export function useMarkOnboardingSeenMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markOnboardingSeen,
    onSuccess: () => {
      queryClient.setQueryData(ONBOARDING_QUERY_KEY, true);
    },
  });
}
