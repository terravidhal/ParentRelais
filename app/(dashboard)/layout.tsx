import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

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
    <DashboardShell userEmail={user.email ?? "Compte admin"}>
      {children}
    </DashboardShell>
  );
}
