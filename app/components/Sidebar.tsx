"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  Repeat,
  QrCode,
  FileText,
  Settings,
  LogOut,
  Building2,
  Download,
  FileUp,
  History as HistoryIcon,
} from "lucide-react";
import { signOut } from "@/app/lib/supabaseClient";
import { getEntrepriseData } from "@/app/lib/store";
import { useRole, PAGES_PAR_ROLE } from "@/app/lib/roles";

const LIENS = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, page: "dashboard" },
  { href: "/immobilisations", label: "Immobilisations", icon: Boxes, page: "immobilisations" },
  { href: "/reaffectations", label: "Réaffectations", icon: Repeat, page: "reaffectations" },
  { href: "/scan", label: "Scanner QR", icon: QrCode, page: "scan" },
  { href: "/immobilisations/rapport", label: "Rapport PDF", icon: FileText, page: "rapport" },
  { href: "/exports", label: "Exports", icon: Download, page: "exports" },
  { href: "/journal", label: "Journal d'audit", icon: HistoryIcon, page: "journal" },
  { href: "/import", label: "Import Excel", icon: FileUp, page: "import" },
  { href: "/parametres", label: "Paramètres", icon: Settings, page: "parametres" },
];

// Texte lisible quelle que soit la couleur de fond (NAV-02)
function texteSurFond(hex: string): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.5 ? "#1f2937" : "#ffffff";
}

export default function Sidebar() {
  const pathname = usePathname();
  const role = useRole();
  const [entreprise, setEntreprise] = useState(getEntrepriseData());
  const [logoOk, setLogoOk] = useState(true);

  useEffect(() => {
    const maj = () => setEntreprise(getEntrepriseData());
    window.addEventListener("storage", maj);
    return () => window.removeEventListener("storage", maj);
  }, []);

  const couleur = entreprise.couleurPrincipale || "#1e3a8a";
  const texte = texteSurFond(couleur);

  // ✅ Menu filtré selon le rôle
  const liensVisibles = role ? LIENS.filter((l) => PAGES_PAR_ROLE[role].includes(l.page)) : [];

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const estActif = (href: string) => {
    if (href === "/immobilisations") {
      return pathname === "/immobilisations" || pathname.startsWith("/immobilisations/ajouter");
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside
      className="fixed inset-y-0 left-0 w-64 flex flex-col z-40 print:hidden"
      style={{ backgroundColor: couleur, color: texte }}
    >
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: texte + "22" }}>
        {logoOk && entreprise.logo ? (
          <img
            src={entreprise.logo}
            alt=""
            onError={() => setLogoOk(false)}
            className="h-9 w-9 rounded-lg bg-white object-contain p-1"
          />
        ) : (
          <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5" style={{ color: couleur }} />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-bold leading-tight truncate">Gestion Immo</p>
          <p className="text-xs opacity-80 truncate">{entreprise.nom}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {liensVisibles.map(({ href, label, icon: Icon }) => {
          const actif = estActif(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                actif ? "bg-white/25" : "opacity-80 hover:opacity-100 hover:bg-white/10"
              }`}
              style={{ color: texte }}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t space-y-2" style={{ borderColor: texte + "22" }}>
        <p className="text-sm font-medium capitalize" style={{ color: texte }}>
          {role || "…"}
        </p>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition"
          style={{ color: texte }}
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}