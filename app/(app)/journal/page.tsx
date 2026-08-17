"use client";

import { useState, useEffect } from "react";
import { History } from "lucide-react";
import { getJournalAudit } from "@/app/lib/store";
import BoutonsExport from "@/app/components/BoutonsExport";
import { ColonneExport } from "@/app/lib/export";

export default function JournalPage() {
  const [journal, setJournal] = useState<any[]>([]);
  const [filtreAuteur, setFiltreAuteur] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    (async () => {
      setJournal(await getJournalAudit());
      setChargement(false);
    })();
  }, []);

  const entreesFiltrees = journal.filter((j) => {
    const date = (j.created_at || "").slice(0, 10);
    return (
      (!filtreAuteur || (j.auteur || "").toLowerCase().includes(filtreAuteur.toLowerCase())) &&
      (!dateDebut || date >= dateDebut) &&
      (!dateFin || date <= dateFin)
    );
  });

  const COLONNES: ColonneExport[] = [
    { cle: "date", titre: "Date" },
    { cle: "auteur", titre: "Auteur" },
    { cle: "table_concernee", titre: "Table" },
    { cle: "champ", titre: "Champ / Opération" },
    { cle: "ancienne_valeur", titre: "Ancienne valeur" },
    { cle: "nouvelle_valeur", titre: "Nouvelle valeur" },
  ];
  const lignes = entreesFiltrees.map((j) => ({
    ...j,
    date: (j.created_at || "").slice(0, 16).replace("T", " "),
  }));

  if (chargement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <History className="h-8 w-8 text-blue-600" /> Journal d'audit
          </h1>
          <p className="text-gray-600">Qui a fait quoi, quand : créations, modifications comptables, sorties, suppressions.</p>
        </div>
        <BoutonsExport nomFichier="journal-audit" lignes={lignes} colonnes={COLONNES} nomFeuille="Journal" />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Auteur</label>
            <input
              type="text"
              value={filtreAuteur}
              onChange={(e) => setFiltreAuteur(e.target.value)}
              placeholder="email..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Du</label>
            <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Au</label>
            <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Auteur</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Table</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Champ / Opération</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Ancienne → Nouvelle valeur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entreesFiltrees.map((j) => (
                <tr key={j.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{(j.created_at || "").slice(0, 16).replace("T", " ")}</td>
                  <td className="py-3 px-4 text-gray-900">{j.auteur}</td>
                  <td className="py-3 px-4 text-gray-600">{j.table_concernee}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{j.champ}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    <span className="line-through text-red-500">{j.ancienne_valeur || "—"}</span>
                    {" → "}
                    <span className="font-medium text-gray-900">{j.nouvelle_valeur || "—"}</span>
                  </td>
                </tr>
              ))}
              {entreesFiltrees.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-500">Aucune entrée pour ces critères.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}