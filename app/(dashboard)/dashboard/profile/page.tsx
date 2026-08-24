import { redirect } from "next/navigation";
import { Mail, Shield, UserCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AdminSignOutButton } from "@/components/dashboard/admin-sign-out-button";

/**
 * Profil de l'administrateur.
 *
 * Manquait entièrement : le seul moyen de se déconnecter était le bouton de
 * l'en-tête, que rien ne signalait.
 */
export default async function DashboardProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/dashboard/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, region")
    .eq("id", user.id)
    .single();

  return (
    <div className="lg:max-w-2xl">
      <div className="mb-6">
        <p className="font-display text-xs font-semibold tracking-wide text-accent-ink">
          PILOTAGE NATIONAL
        </p>
        <h1 className="font-display text-2xl font-bold">Mon profil</h1>
      </div>

      <section className="surface-raised">
        <h2 className="font-display mb-3 flex items-center gap-2 font-bold">
          <UserCircle2 size={16} aria-hidden="true" /> Identité
        </h2>
        <dl className="flex flex-col gap-2.5 text-sm">
          <div className="flex items-center gap-2">
            <dt className="sr-only">Nom</dt>
            <dd className="font-semibold">
              {profile?.full_name ?? "Compte administrateur"}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <Mail size={15} className="text-muted-foreground" aria-hidden="true" />
            <dt className="sr-only">Email</dt>
            <dd className="break-all text-muted-foreground">{user.email}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Shield size={15} className="text-muted-foreground" aria-hidden="true" />
            <dt className="sr-only">Rôle</dt>
            <dd>
              <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
                {profile?.role === "admin" ? "Administrateur" : "Facilitateur"}
              </span>
              {profile?.region && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {profile.region}
                </span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      <div className="mt-4">
        <AdminSignOutButton />
      </div>
    </div>
  );
}
