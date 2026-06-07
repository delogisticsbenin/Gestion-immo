"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUser } from "@/app/lib/supabaseClient";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [chargement, setChargement] = useState(true);
  const [estConnecte, setEstConnecte] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const verifierSession = async () => {
      const user = await getCurrentUser();
      setEstConnecte(!!user);
      setChargement(false);

      // Si pas connecté et sur une page protégée
      if (!user && pathname !== "/login") {
        router.push("/login");
      }
    };

    verifierSession();
  }, [pathname, router]);

  if (chargement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}