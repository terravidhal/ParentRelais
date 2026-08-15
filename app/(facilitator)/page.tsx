"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { useModulesQuery } from "@/lib/hooks/use-modules-query";
import { useFacilitatorSessionQuery } from "@/lib/hooks/use-facilitator-session";
import {
  usePreferredLangQuery,
  useSetPreferredLangMutation,
} from "@/lib/hooks/use-preferred-lang";
import { LangPills } from "@/components/facilitator/lang-pills";
import { ModuleCard } from "@/components/facilitator/module-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CachedModule } from "@/lib/db/dexie";

export default function HomePage() {
  const router = useRouter();
  const { data: session, isLoading: sessionLoading } = useFacilitatorSessionQuery();
  const { data: modules = [], isLoading: modulesLoading } = useModulesQuery();
  const { data: lang = "fr" } = usePreferredLangQuery();
  const setLangMutation = useSetPreferredLangMutation();

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace("/login");
    }
  }, [sessionLoading, session, router]);

  const handleOpen = (module: CachedModule) => {
    router.push(`/modules/${module.id}`);
  };

  if (sessionLoading || !session) {
    return <Skeleton className="h-40 w-full" />;
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <div>
          <p className="font-display text-xs font-semibold tracking-wide text-accent">
            PARENTRELAIS
          </p>
          <h1 className="font-display text-xl font-bold">
            Bonjour, {session.full_name}
          </h1>
        </div>
        <div className="font-display flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft font-bold text-accent">
          {session.full_name.slice(0, 2).toUpperCase()}
        </div>
      </div>

      <div className="mt-4 mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1 text-sm font-semibold text-muted-foreground">
          <BookOpen size={14} aria-hidden="true" /> Modules de formation
        </p>
        <LangPills
          lang={lang}
          onLangChange={(l) => setLangMutation.mutate(l)}
        />
      </div>

      <div className="flex flex-col gap-3">
        {modulesLoading ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : (
          modules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              lang={lang}
              onOpen={handleOpen}
            />
          ))
        )}
      </div>
    </div>
  );
}
