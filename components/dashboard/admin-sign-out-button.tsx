"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AdminSignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    router.push("/dashboard/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 text-sm font-semibold text-destructive"
    >
      <LogOut size={16} aria-hidden="true" />
      Se déconnecter
    </button>
  );
}
