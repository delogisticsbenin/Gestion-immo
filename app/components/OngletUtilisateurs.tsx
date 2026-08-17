"use client";

import { useState, useEffect } from "react";
import { UserPlus, KeyRound, UserX, UserCheck } from "lucide-react";
import { supabase } from "@/app/lib/supabaseClient";

const ROLES = ["administrateur", "gestionnaire", "lecteur"];

export default function OngletUtilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState<any[]>([]);
  const [moi, setMoi] = useState("");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [form, setForm] = useState({ nom: "", email: "", password: "", role: "gestionnaire" });
  const [creation, setCreation] = useState(false);

  const jeton = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  };

  const charger = async () => {
    setChargement(true);
    const token = await jeton();
    const res = await fetch("/api/admin/utilisateurs", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setUtilisateurs(await res.json());
    else setErreur("Accès refusé : réservé aux administrateurs.");
    setChargement(false);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMoi((data.user?.email || "").toLowerCase()));
    charger();
  }, []);

  const creer = async () => {
    setErreur(""); setSucces("");
    if (!form.email || form.password.length < 6) {
      setErreur("Email requis et mot de passe d'au moins 6 caractères.");
      return;
    }
    setCreation(true);
    const token = await jeton();
    const res = await fetch("/api/admin/utilisateurs", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    setCreation(false);
    if (res.ok) {
      setSucces(`Compte ${form.email} créé (${form.role}).`);
      setForm({ nom: "", email: "", password: "", role: "gestionnaire" });
      charger();
    } else {
      const j = await res.json().catch(() => ({}));
      setErreur(j.error || "Erreur lors de la création.");
    }
  };

  const modifier = async (id: string, patch: any) => {
    setErreur(""); setSucces("");
    const token = await jeton();
    const res = await fetch(`/api/admin/utilisateurs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    });
    if (res.ok) { setSucces("Modification enregistrée."); charger(); }
    else setErreur("Modification refusée.");
  };

  const reinitialiserMotDePasse = async (u: any) => {
    const pwd = prompt(`Nouveau mot de passe pour ${u.email} (6 caractères min) :`);
    if (!pwd) return;
    if (pwd.length < 6) { alert("Mot de passe trop court."); return; }
    await modifier(u.id, { password: pwd });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">👤 Utilisateurs et rôles</h2>

      {erreur && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">⛔ {erreur}</div>}
      {succes && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">✓ {succes}</div>}

      {/* Création */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">Créer un compte</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <input type="text" value={form.nom} placeholder="Nom"
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          <input type="email" value={form.email} placeholder="Email"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          <input type="password" value={form.password} placeholder="Mot de passe (6 min)"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <button onClick={creer} disabled={creation}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">
          <UserPlus className="h-5 w-5" /> {creation ? "Création..." : "Créer le compte"}
        </button>
      </div>

      {/* Liste */}
      {chargement ? (
        <p className="text-gray-500">Chargement...</p>
      ) : (
        <div className="space-y-2">
          {utilisateurs.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="min-w-0">
                <p className="font-medium text-gray-900">{u.nom || "(sans nom)"} {u.email === moi && <span className="text-xs text-blue-600">(vous)</span>}</p>
                <p className="text-sm text-gray-600">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <select value={u.role} onChange={(e) => modifier(u.id, { role: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <button onClick={() => reinitialiserMotDePasse(u)} title="Réinitialiser le mot de passe"
                  className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition">
                  <KeyRound className="h-4 w-4" />
                </button>
                {u.actif ? (
                  <button onClick={() => modifier(u.id, { actif: false })} disabled={u.email === moi}
                    title="Révoquer l'accès"
                    className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-sm disabled:opacity-40">
                    <UserX className="h-4 w-4" /> Révoquer
                  </button>
                ) : (
                  <button onClick={() => modifier(u.id, { actif: true })}
                    className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm">
                    <UserCheck className="h-4 w-4" /> Réactiver
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}