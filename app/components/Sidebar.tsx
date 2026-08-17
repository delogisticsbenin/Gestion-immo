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
  FileUp,
  Download,
  History as HistoryIcon,
} from "lucide-react";
import { signOut } from "@/app/lib/supabaseClient";
import { getEntrepriseData } from "@/app/lib/store";

const LIENS = [
  { href: "/exports", label: "Exports", icon: Download },
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/journal", label: "Journal d'audit", icon: HistoryIcon },
  { href: "/immobilisations", label: "Immobilisations", icon: Boxes },
  { href: "/reaffectations", label: "Réaffectations", icon: Repeat },
  { href: "/scan", label: "Scanner QR", icon: QrCode },
  { href: "/import", label: "Import Excel", icon: FileUp },
  { href: "/immobilisations/rapport", label: "Rapport PDF", icon: FileText },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

// ✅ NAV-02 / PAR-03 : couleur du texte calculée selon la luminance du fond (ratio WCAG)
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
  const [entreprise, setEntreprise] = useState(getEntrepriseData());
  const [logoOk, setLogoOk] = useState(true);

  useEffect(() => {
    const maj = () => setEntreprise(getEntrepriseData());
    window.addEventListener("storage", maj);
    return () => window.removeEventListener("storage", maj);
  }, []);

  const couleur = entreprise.couleurPrincipale || "#1e3a8a";
  const texte = texteSurFond(couleur);

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
      className="fixed inset-y-0 left-0 w-64 flex flex-col z-40"
      style={{ backgroundColor: couleur, color: texte }}
    >
      {/* ✅ PAR-05 : logo + nom du produit + nom de l'entreprise */}
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

      {/* ✅ NAV-05 : uniquement des LIEUX, pas d'action « Ajouter » */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {LIENS.map(({ href, label, icon: Icon }) => {
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

      {/* ✅ NAV-02 : pied de menu lisible (texte calculé selon le fond) */}
      <div className="px-5 py-4 border-t space-y-2" style={{ borderColor: texte + "22" }}>
        <p className="text-sm font-medium" style={{ color: texte }}>
          {entreprise.nom || "Dé Logistics"}
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