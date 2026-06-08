"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getImmobilisations, formatMontant, getDevise } from "@/app/lib/store";

export default function DashboardPage() {
  const [immobilisations, setImmobilisations] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [devise, setDevise] = useState({ code: "FCFA", symbole: "FCFA" });

  useEffect(() => {
    const chargerDonnees = async () => {
      setChargement(true);
      try {
        const data = await getImmobilisations();
        setImmobilisations(data);
        setDevise(getDevise());
      } catch (error) {
        console.error("Erreur chargement dashboard:", error);
      } finally {
        setChargement(false);
      }
    };
    chargerDonnees();
  }, []);

  const totalImmobilisations = immobilisations.length;
  const valeurTotale = immobilisations.reduce((sum, i) => sum + (i.montant || 0), 0);
  
  const enPanne = immobilisations.filter(i => i.etat === "En panne").length;
  const totalementAmortis = immobilisations.filter(i => i.annee_amortissement <= 0).length;

  const categories = immobilisations.reduce((acc: any, i) => {
    acc[i.categorie] = (acc[i.categorie] || 0) + i.montant;
    return acc;
  }, {});

  const immobilisationsRecentes = [...immobilisations]
    .sort((a, b) => new Date(b.date_acquisition).getTime() - new Date(a.date_acquisition).getTime())
    .slice(0, 5);

  if (chargement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📊 Tableau de bord analytique</h1>
            <p className="text-sm text-gray-600 mt-1">Vue d'ensemble du parc d'immobilisations • Devise : {devise.symbole}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Administrateur connecté</p>
            <p className="font-semibold text-gray-900">admin@entreprise.com</p>
          </div>
        </div>
      </header>

      <main className="p-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 mb-2">Total Équipements</p>
            <p className="text-3xl font-bold text-gray-900">{totalImmobilisations}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <p className="text-sm text-gray-600 mb-2">Valeur Totale</p>
            <p className="text-3xl font-bold text-gray-900">{formatMontant(valeurTotale)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
            <p className="text-sm text-gray-600 mb-2">En Panne</p>
            <p className="text-3xl font-bold text-red-600">{enPanne}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600 mb-2">Totalement Amortis</p>
            <p className="text-3xl font-bold text-yellow-600">{totalementAmortis}</p>
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Valeur par Catégorie */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">💰 Valeur par Catégorie</h2>
            {Object.keys(categories).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(categories).map(([categorie, montant]: [string, any]) => {
                  const percentage = valeurTotale > 0 ? ((montant / valeurTotale) * 100).toFixed(0) : 0;
                  return (
                    <div key={categorie}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-gray-700">{categorie}</span>
                        <span className="text-gray-600">{formatMontant(montant)} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">Aucune donnée disponible</p>
              </div>
            )}
          </div>

          {/* Valeur par Service */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">🏢 Valeur par Service ({devise.symbole})</h2>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <p className="text-gray-500">Graphique à venir</p>
            </div>
          </div>
        </div>

        {/* Alertes et Activités */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">🔔 Alertes et Activité récente</h2>
            <div className="space-y-3">
              {enPanne > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">
                    ⚠️ {enPanne} équipement{enPanne > 1 ? 's' : ''} signalé{enPanne > 1 ? 's' : ''} en panne
                  </p>
                </div>
              )}
              
              {immobilisationsRecentes.slice(0, 3).map((immo) => (
                <div key={immo.id} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium">
                    ➕ {immo.nom} ({immo.code_interne})
                  </p>
                </div>
              ))}

              {immobilisations.length === 0 && (
                <div className="bg-gray-50 border-l-4 border-gray-300 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Aucune activité pour le moment</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">🚀 Actions rapides</h2>
            <div className="space-y-3">
              <Link 
                href="/immobilisations/ajouter"
                className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow-md"
              >
                ➕ Nouvel équipement
              </Link>
              
              <Link 
                href="/immobilisations"
                className="block w-full bg-gray-100 text-gray-700 text-center py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                📋 Voir la liste
              </Link>
              
              <Link 
                href="/scan"
                className="block w-full bg-gray-100 text-gray-700 text-center py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                📷 Scanner QR Code
              </Link>
              
              <Link 
                href="/immobilisations/rapport"
                className="block w-full bg-gray-100 text-gray-700 text-center py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
              >
                📄 Rapport PDF
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}