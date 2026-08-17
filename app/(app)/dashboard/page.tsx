"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer 
} from 'recharts';
import {
  getImmobilisations,
  getServices,
  getCategories,
  getDevise,
  formatMontant,
  initEntreprise,
} from "@/app/lib/store";

const COULEURS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
  const [immobilisations, setImmobilisations] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [devise, setDevise] = useState(getDevise());
  const [alertes, setAlertes] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);

  const chargerDonnees = async () => {
    setChargement(true);
    await initEntreprise();
    setDevise(getDevise());

    const [immoData, servicesData, categoriesData] = await Promise.all([
      getImmobilisations(),
      getServices(),
      getCategories(),
    ]);
    setImmobilisations(immoData);
    setServices(servicesData);
    setCategories(categoriesData);

    // Alertes dynamiques
    const nouvellesAlertes: any[] = [];
    const enPanneListe = immoData.filter((i) => i.etat === "En panne" && i.statut !== "sorti");
    if (enPanneListe.length > 0) {
      nouvellesAlertes.push({
        id: 1,
        type: '⚠️',
        message: `${enPanneListe.length} équipement(s) signalé(s) en panne`,
        couleur: 'text-red-600 bg-red-50',
      });
    }
    if (immoData.length > 0) {
      const dernier = immoData[0];
      nouvellesAlertes.push({
        id: 2,
        type: '✅',
        message: `Nouvel ajout : ${dernier.nom} (${dernier.code_interne})`,
        couleur: 'text-green-600 bg-green-50',
      });
    }
    if (nouvellesAlertes.length === 0) {
      nouvellesAlertes.push({
        id: 0,
        type: 'ℹ️',
        message: 'Aucune alerte pour le moment',
        couleur: 'text-gray-600 bg-gray-50',
      });
    }
    setAlertes(nouvellesAlertes);
    setChargement(false);
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  // Indicateurs sur les équipements EN SERVICE uniquement (IMM-02)
  const enService = immobilisations.filter((i: any) => i.statut !== 'sorti');

  const totalImmobilisations = enService.length;
  const valeurTotale = enService.reduce((sum: number, item: any) => sum + (item.montant || 0), 0);
  const enPanne = enService.filter((item: any) => item.etat === "En panne").length;

  // ✅ TDB-10 : vrai calcul d'amortissement avec garde-fou
  const estTotalementAmorti = (item: any) => {
    const cat = categories.find((c: any) => c.nom === item.categorie);
    const duree = item.annee_amortissement && item.annee_amortissement > 0
      ? item.annee_amortissement
      : cat?.duree_utilite;
    if (!duree || duree <= 0) return false;
    const annees = Math.max(0, new Date().getFullYear() - new Date(item.date_acquisition).getFullYear());
    return annees >= duree;
  };
  const amortis = enService.filter((item: any) => estTotalementAmorti(item)).length;

  const dataParCategorie = (() => {
    const grouped: { [key: string]: number } = {};
    enService.forEach((item: any) => {
      const cat = item.categorie || "Autre";
      grouped[cat] = (grouped[cat] || 0) + (item.montant || 0);
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  })();

  // ✅ TDB-01 : agrégation par NOM de service via le référentiel
  const dataParService = (() => {
    const grouped: { [key: string]: number } = {};
    enService.forEach((item: any) => {
      const svc = services.find((s: any) => s.id === item.service_id);
      const cle = svc?.nom?.trim() || "Autre";
      grouped[cle] = (grouped[cle] || 0) + (item.montant || 0);
    });
    return Object.entries(grouped).map(([name, valeur]) => ({ name, valeur }));
  })();

  if (chargement) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📊 Tableau de bord analytique</h1>
            <p className="text-gray-500">Vue d'ensemble du parc d'immobilisations • Devise : {devise.symbole}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Administrateur connecté</p>
            <p className="font-semibold text-gray-900">admin@entreprise.com</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-blue-500">
            <p className="text-sm text-gray-500">Total Équipements</p>
            <p className="text-3xl font-bold text-gray-900">{totalImmobilisations}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-green-500">
            <p className="text-sm text-gray-500">Valeur Totale</p>
            <p className="text-3xl font-bold text-gray-900">{formatMontant(valeurTotale)}</p>
          </div>
          {/* ✅ TDB-05 : vert si aucune panne, rouge sinon */}
          <div className={`bg-white p-5 rounded-xl shadow-sm border-l-4 ${enPanne === 0 ? "border-green-500" : "border-red-500"}`}>
            <p className="text-sm text-gray-500">En Panne</p>
            <p className={`text-3xl font-bold ${enPanne === 0 ? "text-green-600" : "text-red-600"}`}>{enPanne}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-yellow-500">
            <p className="text-sm text-gray-500">Totalement Amortis</p>
            <p className="text-3xl font-bold text-yellow-600">{amortis}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">💰 Valeur par Catégorie</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataParCategorie}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {dataParCategorie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COULEURS[index % COULEURS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => typeof value === 'number' ? formatMontant(value) : value} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">🏢 Valeur par Service ({devise.symbole})</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataParService}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => typeof value === 'number' ? formatMontant(value) : value} />
                  <Legend />
                  <Bar dataKey="valeur" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">🔔 Alertes et Activité récente</h3>
            <div className="space-y-3">
              {alertes.map((alerte) => (
                <div key={alerte.id} className={`p-3 rounded-lg flex items-center gap-3 ${alerte.couleur}`}>
                  <span className="text-xl">{alerte.type}</span>
                  <span className="font-medium text-sm">{alerte.message}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">🚀 Actions rapides</h3>
            <div className="space-y-3">
              <Link href="/immobilisations/ajouter" className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition font-medium">
                ➕ Nouvel équipement
              </Link>
              <Link href="/immobilisations" className="block w-full bg-gray-100 text-gray-800 text-center py-3 rounded-lg hover:bg-gray-200 transition font-medium">
                📋 Voir la liste
              </Link>
              <Link href="/reaffectations" className="block w-full bg-gray-100 text-gray-800 text-center py-3 rounded-lg hover:bg-gray-200 transition font-medium">
                🔄 Gérer les transferts
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}