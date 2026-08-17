"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";

export type Role = "administrateur" | "gestionnaire" | "lecteur";

// ✅ PAR-06 : pages visibles par rôle
export const PAGES_PAR_ROLE: Record<Role, string[]> = {
  administrateur: ["dashboard", "immobilisations", "reaffectations", "scan", "rapport", "exports", "journal", "import", "parametres"],
  gestionnaire: ["dashboard", "immobilisations", "reaffectations", "scan", "rapport"],
  lecteur: ["dashboard", "immobilisations", "reaffectations", "scan", "rapport"],
};

export const useRole = (): Role | null => {
  const [role, setRole] = useState<Role | null>(null);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { setRole("lecteur"); return; }
      const email = (data.user.email || "").toLowerCase();
      const { data: profil } = await supabase
        .from("utilisateurs")
        .select("role")
        .eq("email", email)
        .maybeSingle();
      setRole((profil?.role as Role) || "administrateur");
    })();
  }, []);
  return role;
};

// ✅ lecteur = aucune modification
export const usePeutEcrire = (): boolean => {
  const role = useRole();
  return role !== null && role !== "lecteur";
};