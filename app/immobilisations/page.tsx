"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import Link from "next/link";
import {
  getImmobilisations,
  deleteImmobilisation,
  formatMontant,
  getDevise,
  initEntreprise,
} from "@/app/lib/store";

const categories = ["Toutes", "Informatique", "Mobilier de bureau", "Véhicule", "Outillage", "Électronique"];
const etats = ["Tous", "Neuf", "Bon état", "Usagé", "En panne", "Réformé"];

export default function ListeImmobilisations() {
  const [immobilisations, setImmobilisations] = useState<any[]>([]);
  const [recherche, setRecherche] = useState("");
  const [filtreCategorie, setFiltreCategorie] = useState("Toutes");
  const [filtreEtat, setFiltreEtat] = useState("Tous");
  const [filtreService, setFiltreService] = useState("Tous");
  const [devise, setDevise] = useState(getDevise());
  const [chargement, setChargement] = useState(true);

  const chargerDonnees = async () => {
    setChargement(true);
    await initEntreprise();
    setDevise(getDevise());
    const data = await getImmobilisations();
    setImmobilisations(data);
    setChargement(false);
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  const servicesList = ["Tous", ...Array.from(new Set(immobilisations.map((i) => i.service_nom)))];

  const immobilisationsFiltrees = immobilisations.filter((immo) => {
    const correspondRecherche =
      immo.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      immo.code_interne.toLowerCase().includes(recherche.toLowerCase()) ||
      (immo.personnel_nom || "").toLowerCase().includes(recherche.toLowerCase());

    const correspondCategorie = filtreCategorie === "Toutes" || immo.categorie === filtreCategorie;
    const correspondEtat = filtreEtat === "Tous" || immo.etat === filtreEtat;
    const correspondService = filtreService === "Tous" || immo.service_nom === filtreService;

    return correspondRecherche && correspondCategorie && correspondEtat && correspondService;
  });

  const handleExportExcel = () => {
    const dataToExport = immobilisationsFiltrees.map((immo) => ({
      "Code": immo.code_interne,
      "Catégorie": immo.categorie,
      "Nom": immo.nom,
      "Modèle": immo.modele,
      "N° Série": immo.numero_serie,
      "État": immo.etat,
      "Montant": immo.montant,
      "Amortissement (ans)": immo.annee_amortissement,
      "Service": immo.service_nom,
      "Personnel": immo.personnel_nom,
      "Date acquisition": immo.date_acquisition,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Immobilisations");
    XLSX.writeFile(workbook, `immobilisations_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleSupprimer = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet équipement ?")) {
      await deleteImmobilisation(id);
      await chargerDonnees();
    }
  };

  const totalMontant = immobilisationsFiltrees.reduce((sum, immo) => sum + (immo.montant || 0), 0);
  const totalElements = immobilisationsFiltrees.length;

  if (chargement) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900"> Liste des Immobilisations</h1>
          <p className="text-gray-600 mt-1">
            {totalElements} équipement(s) • Valeur totale : {formatMontant(totalMontant)}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard" className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition">
            ← Dashboard
          </Link>
          <Link href="/immobilisations/ajouter" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            ➕ Ajouter
          </Link>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="font-semibold mb-4">🔍 Filtres et recherche</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <input type="text" placeholder="Nom, code, personnel..." value={recherche} onChange={(e) => setRecherche(e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <select value={filtreCategorie} onChange={(e) => setFiltreCategorie(e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg">
              {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">État</label>
            <select value={filtreEtat} onChange={(e) => setFiltreEtat(e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg">
              {etats.map((etat) => <option key={etat} value={etat}>{etat}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
            <select value={filtreService} onChange={(e) => setFiltreService(e.target.value)} className="w-full border border-gray-300 p-2 rounded-lg">
              {servicesList.map((service) => <option key={service} value={service}>{service}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <button onClick={handleExportExcel} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2">
          📥 Exporter Excel
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">État</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Personnel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {immobilisationsFiltrees.length > 0 ? (
                immobilisationsFiltrees.map((immo) => (
                  <tr key={immo.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">{immo.code_interne}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{immo.nom}</div>
                      <div className="text-sm text-gray-500">{immo.modele}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{immo.categorie}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        immo.etat === "Neuf" ? "bg-green-100 text-green-800" :
                        immo.etat === "Bon état" ? "bg-blue-100 text-blue-800" :
                        immo.etat === "Usagé" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {immo.etat}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatMontant(immo.montant)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{immo.service_nom}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{immo.personnel_nom}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button onClick={() => handleSupprimer(immo.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition">🗑️</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Aucun équipement ne correspond à vos filtres
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        Affichage de {immobilisationsFiltrees.length} sur {immobilisations.length} équipement(s)
      </div>
    </div>
  );
}