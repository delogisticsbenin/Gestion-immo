"use client";

import { useState, useEffect } from "react";
import { Printer, FileText } from "lucide-react";
import {
  getImmobilisations,
  getServices,
  getCategories,
  getEntrepriseData,
  formatMontant,
} from "@/app/lib/store";

export default function RapportPage() {
  const [immobilisations, setImmobilisations] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [filtreService, setFiltreService] = useState("");
  const [filtreCategorie, setFiltreCategorie] = useState("");
  const [inclureSortis, setInclureSortis] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [entreprise] = useState(getEntrepriseData());

  useEffect(() => {
    (async () => {
      const [i, s, c] = await Promise.all([
        getImmobilisations(),
        getServices(),
        getCategories(),
      ]);
      setImmobilisations(i);
      setServices(s);
      setCategories(c);
      setChargement(false);
    })();
  }, []);

  // ✅ RAP-02 : colonnes comptables (valeur brute, amortissements cumulés, VNC)
  const lignes = immobilisations
    .filter((i) => inclureSortis || i.statut !== "sorti")
    .filter((i) => !filtreService || i.service_id === filtreService)
    .filter((i) => !filtreCategorie || i.categorie === filtreCategorie)
    .map((i) => {
      const cat = categories.find((c) => c.nom === i.categorie);
      const duree = i.annee_amortissement > 0 ? i.annee_amortissement : (cat?.duree_utilite || 0);
      const annees = Math.max(0, new Date().getFullYear() - new Date(i.date_acquisition).getFullYear());
      const cumul = duree > 0 ? Math.min(i.montant || 0, ((i.montant || 0) / duree) * annees) : 0;
      const vnc = (i.montant || 0) - cumul;
      return { ...i, duree, cumul, vnc };
    });

  const totalBrut = lignes.reduce((s, l) => s + (l.montant || 0), 0);
  const totalCumul = lignes.reduce((s, l) => s + l.cumul, 0);
  const totalVnc = lignes.reduce((s, l) => s + l.vnc, 0);

  const getServiceNom = (id: string) => services.find((s) => s.id === id)?.nom || "-";

  if (chargement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* En-tête — sans bouton retour (RAP-05) */}
      <div className="mb-8 flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rapport PDF</h1>
          <p className="text-gray-600">État des immobilisations conforme SYSCOHADA révisé.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Printer className="h-5 w-5" /> Imprimer / PDF
        </button>
      </div>

      {/* ✅ RAP-01 : paramétrage avant génération */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
            <select
              value={filtreService}
              onChange={(e) => setFiltreService(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les services</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
            <select
              value={filtreCategorie}
              onChange={(e) => setFiltreCategorie(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((c) => <option key={c.id} value={c.nom}>{c.nom}</option>)}
            </select>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={inclureSortis}
                onChange={(e) => setInclureSortis(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Inclure les biens sortis du parc</span>
            </label>
          </div>
        </div>
      </div>

      {/* ✅ RAP-03 : aperçu = totaux comptables, pas des cartes du tableau de bord */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Valeur brute</p>
          <p className="text-2xl font-bold text-gray-900">{formatMontant(totalBrut)}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500">Amortissements cumulés</p>
          <p className="text-2xl font-bold text-gray-900">{formatMontant(totalCumul)}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Valeur nette comptable</p>
          <p className="text-2xl font-bold text-gray-900">{formatMontant(totalVnc)}</p>
        </div>
      </div>

      {/* ✅ RAP-04 : aperçu avant impression */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* En-tête du document imprimé (PAR-05 : logo) */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {entreprise.logo && (
              <img src={entreprise.logo} alt="" className="h-10 w-10 object-contain" />
            )}
            <div>
              <p className="font-bold text-gray-900">{entreprise.nom || "Dé Logistics"}</p>
              <p className="text-sm text-gray-600">
                État des immobilisations — généré le {new Date().toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Code</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Désignation</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Catégorie</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Acquisition</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Durée</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Valeur brute</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Amort. cumulés</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">VNC</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Service</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lignes.map((l) => (
                <tr key={l.id}>
                  <td className="py-3 px-4 font-mono text-blue-600">{l.code_interne}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{l.nom}</td>
                  <td className="py-3 px-4 text-gray-600">{l.categorie}</td>
                  <td className="py-3 px-4 text-gray-600">{new Date(l.date_acquisition).toLocaleDateString("fr-FR")}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{l.duree > 0 ? `${l.duree} ans` : "—"}</td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatMontant(l.montant || 0)}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{formatMontant(l.cumul)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatMontant(l.vnc)}</td>
                  <td className="py-3 px-4 text-gray-600">{getServiceNom(l.service_id)}</td>
                </tr>
              ))}
              {lignes.length === 0 && (
                <tr><td colSpan={9} className="py-8 text-center text-gray-500">Aucune immobilisation pour ces critères.</td></tr>
              )}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200 font-semibold">
              <tr>
                <td colSpan={5} className="py-3 px-4 text-right text-gray-700">Totaux</td>
                <td className="py-3 px-4 text-right text-gray-900">{formatMontant(totalBrut)}</td>
                <td className="py-3 px-4 text-right text-gray-900">{formatMontant(totalCumul)}</td>
                <td className="py-3 px-4 text-right text-gray-900">{formatMontant(totalVnc)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}