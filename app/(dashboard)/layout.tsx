import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Server component — zone en ligne (CLAUDE.md règle 2). Non exécutable en
 * bout-à-bout tant qu'un projet Supabase n'est pas configuré (.env.local
 * absent), mais le code doit rester complet et correct.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/dashboard/login");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">{children}</div>
  );
}
