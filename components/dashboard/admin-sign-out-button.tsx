"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AdminSignOutButton() {
  const router = useRouter();
  // La déconnexion fait un aller-retour réseau : sans retour visuel, on
  // clique deux fois en croyant que rien ne s'est passé.
  const [pending, setPending] = useState(false);

  const handleSignOut = async () => {
    setPending(true);
    try {
      await createClient().auth.signOut();
      router.push("/dashboard/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 text-sm font-semibold text-destructive disabled:opacity-60"
    >
      {pending ? (
        <Loader2 size={16} aria-hidden="true" className="motion-safe:animate-spin" />
      ) : (
        <LogOut size={16} aria-hidden="true" />
      )}
      {pending ? "Déconnexion…" : "Se déconnecter"}
    </button>
  );
}
