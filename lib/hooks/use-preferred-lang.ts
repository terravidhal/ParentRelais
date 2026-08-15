"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readPreferredLang, savePreferredLang } from "@/lib/db/preferences";

const LANG_QUERY_KEY = ["dexie", "meta", "preferred_lang"];

export function usePreferredLangQuery() {
  return useQuery({
    queryKey: LANG_QUERY_KEY,
    queryFn: readPreferredLang,
  });
}

export function useSetPreferredLangMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: savePreferredLang,
    onSuccess: (_data, lang) => {
      queryClient.setQueryData(LANG_QUERY_KEY, lang);
    },
  });
}
