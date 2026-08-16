"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "@/app/lib/supabaseClient";

const MAX_TENTATIVES = 5;
const DUREE_VERROUILLAGE_BASE = 30; // secondes

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [chargement, setChargement] = useState(false);
  const [logoOk, setLogoOk] = useState(true);
  const [verrouillage, setVerrouillage] = useState<{ actif: boolean; secondesRestantes: number }>({
    actif: false,
    secondesRestantes: 0,
  });

  // ✅ CON-02 : session active → redirection vers le tableau de bord
  useEffect(() => {
    const verifierSession = async () => {
      const session = await getSession();
      if (session) router.replace("/dashboard");
    };
    verifierSession();
  }, [router]);

  // ✅ CON-03 : reprise d'un verrou existant au chargement
  useEffect(() => {
    const finVerrou = Number(localStorage.getItem("auth_verrou_jusqua") || 0);
    const restantes = Math.ceil((finVerrou - Date.now()) / 1000);
    if (finVerrou && restantes > 0) {
      setVerrouillage({ actif: true, secondesRestantes: restantes });
    } else if (finVerrou) {
      localStorage.removeItem("auth_verrou_jusqua");
      localStorage.removeItem("auth_tentatives");
    }
  }, []);

  // ✅ CON-03 : décompte seconde par seconde
  useEffect(() => {
    if (!verrouillage.actif) return;
    const t = setInterval(() => {
      setVerrouillage((v) => {
        if (v.secondesRestantes <= 1) {
          localStorage.removeItem("auth_verrou_jusqua");
          localStorage.removeItem("auth_tentatives");
          return { actif: false, secondesRestantes: 0 };
        }
        return { actif: true, secondesRestantes: v.secondesRestantes - 1 };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [verrouillage.actif]);

  const enregistrerEchec = () => {
    const tentatives = Number(localStorage.getItem("auth_tentatives") || 0) + 1;
    localStorage.setItem("auth_tentatives", String(tentatives));

    if (tentatives >= MAX_TENTATIVES) {
      const duree = DUREE_VERROUILLAGE_BASE * Math.pow(2, tentatives - MAX_TENTATIVES);
      localStorage.setItem("auth_verrou_jusqua", String(Date.now() + duree * 1000));
      setVerrouillage({ actif: true, secondesRestantes: duree });
      return `Trop de tentatives échouées. Réessayez dans ${duree} secondes.`;
    }
    return `Email ou mot de passe incorrect. Tentative ${tentatives}/${MAX_TENTATIVES}.`;
  };

  const reinitialiserTentatives = () => {
    localStorage.removeItem("auth_tentatives");
    localStorage.removeItem("auth_verrou_jusqua");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verrouillage.actif) return;

    setError("");
    setChargement(true);

    try {
      const { data, error } = await signIn(email, password);

      if (error) {
        setError(enregistrerEchec());
      } else if (data.user) {
        reinitialiserTentatives();
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError(enregistrerEchec());
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">

        {/* ✅ CON-01 : identité visuelle (logo + nom du produit) */}
        <div className="text-center mb-8">
          {logoOk ? (
            <img
              src="/logo-delogistics.png"
              alt="Dé Logistics"
              onError={() => setLogoOk(false)}
              className="mx-auto mb-4 h-16 w-auto object-contain"
            />
          ) : (
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
              <svg className="h-9 w-9 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          )}
          <h1 className="text-3xl font-bold text-gray-900">Gestion Immo</h1>
          <p className="text-gray-600 mt-2">Gestion des immobilisations — Dé Logistics</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@delogistics.com"
              required
              disabled={verrouillage.actif}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={verrouillage.actif}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Cliquez sur l'œil pour afficher le mot de passe</p>
          </div>

          <button
            type="submit"
            disabled={chargement || verrouillage.actif}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {verrouillage.actif
              ? `Verrouillé (${verrouillage.secondesRestantes}s)`
              : chargement
                ? "Connexion..."
                : "Se connecter"
            }
          </button>
        </form>
      </div>
    </div>
  );
}