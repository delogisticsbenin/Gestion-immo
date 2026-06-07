"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { signOut } from "@/app/lib/supabaseClient";
import { useTheme } from "./ThemeProvider";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [logo, setLogo] = useState<string>("");
  const [couleurPrincipale, setCouleurPrincipale] = useState("#3b82f6");
  const [nomEntreprise, setNomEntreprise] = useState("Gestion Immo");

  const chargerDonnees = () => {
    if (typeof window === "undefined") return;
    const savedLogo = localStorage.getItem("entrepriseLogo");
    const savedCouleur = localStorage.getItem("couleurPrincipale");
    const savedNom = localStorage.getItem("nomEntreprise");
    if (savedLogo) setLogo(savedLogo);
    if (savedCouleur) setCouleurPrincipale(savedCouleur);
    if (savedNom) setNomEntreprise(savedNom);
  };

  useEffect(() => {
    chargerDonnees();
    const handleStorage = () => chargerDonnees();
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [pathname]);

  const menuItems = [
    { href: "/dashboard", label: "Tableau de bord", icon: "📊" },
    { href: "/immobilisations", label: "Immobilisations", icon: "📋" },
    { href: "/immobilisations/ajouter", label: "Ajouter", icon: "➕" },
    { href: "/scan", label: "Scanner QR", icon: "📷" },
    { href: "/immobilisations/rapport", label: "Rapport PDF", icon: "📄" },
    { href: "/reaffectations", label: "Réaffectations", icon: "🔄" },
    { href: "/parametres", label: "Paramètres", icon: "⚙️" },
  ];

  const handleDeconnexion = async () => {
    try {
      await signOut();
      localStorage.clear();
      router.push("/login");
    } catch (error) {
      console.error("Erreur déconnexion:", error);
      router.push("/login");
    }
  };

  const darkenColor = (color: string, percent: number): string => {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max((num >> 16) - amt, 0);
    const G = Math.max(((num >> 8) & 0x00FF) - amt, 0);
    const B = Math.max((num & 0x0000FF) - amt, 0);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  };

  const couleurFoncee = darkenColor(couleurPrincipale, 40);

  return (
    <div 
      className="w-64 min-h-screen flex flex-col fixed left-0 top-0 shadow-xl"
      style={{ backgroundColor: couleurFoncee }}
    >
      <div 
        className="p-5 border-b flex items-center gap-4"
        style={{ borderColor: couleurPrincipale + "66" }}
      >
        {logo ? (
          <img 
            src={logo} 
            alt="Logo" 
            className="w-16 h-16 rounded-xl object-cover bg-white p-2 shadow-lg"
          />
        ) : (
          <div 
            className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shadow-lg"
            style={{ backgroundColor: couleurPrincipale }}
          >
            🏢
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-xl text-white truncate leading-tight drop-shadow-md">
            {nomEntreprise}
          </h1>
          <p className="text-xs text-white/90 mt-1 font-medium">Gestion Immobilisations</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive ? "font-bold shadow-lg" : "hover:bg-white/10"
              }`}
              style={isActive ? { 
                backgroundColor: "white",
                color: couleurPrincipale,
              } : {
                backgroundColor: "transparent",
                color: "white",
              }}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-base font-semibold" style={{ color: isActive ? couleurPrincipale : "white" }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div 
        className="p-4 border-t"
        style={{ borderColor: couleurPrincipale + "66" }}
      >
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-white opacity-80 hover:opacity-100 hover:bg-white/20 transition-all duration-200 w-full text-left mb-2"
        >
          <span className="text-2xl">{theme === "light" ? "🌙" : "️"}</span>
          <span className="text-base font-semibold">
            {theme === "light" ? "Mode sombre" : "Mode clair"}
          </span>
        </button>

        <button
          onClick={handleDeconnexion}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-white opacity-80 hover:opacity-100 hover:bg-red-600 transition-all duration-200 w-full text-left"
        >
          <span className="text-2xl">🚪</span>
          <span className="text-base font-semibold">Déconnexion</span>
        </button>
      </div>
    </div>
  );
}