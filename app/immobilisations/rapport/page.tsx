"use client";

import { useState, useEffect } from "react";
import { getImmobilisations, formatMontant } from "@/app/lib/store";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function RapportPage() {
  const [immobilisations, setImmobilisations] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const charger = async () => {
      const data = await getImmobilisations();
      setImmobilisations(data);
      setChargement(false);
    };
    charger();
  }, []);

  const genererPDF = () => {
    const doc = new jsPDF();
    const nomEntreprise = localStorage.getItem("nomEntreprise") || "Dé Logistics";

    // Titre
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246);
    doc.text("Rapport des Immobilisations", 14, 20);

    // Sous-titre
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text(nomEntreprise, 14, 28);
    doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, 14, 34);

    // Statistiques
    const total = immobilisations.reduce((sum, i) => sum + i.montant, 0);
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total: ${immobilisations.length} équipements - Valeur: ${formatMontant(total)}`, 14, 44);

    // Tableau
    const tableData = immobilisations.map((immo) => [
      immo.code_interne,
      immo.nom,
      immo.categorie,
      immo.service_nom,
      formatMontant(immo.montant),
      immo.etat,
    ]);

    autoTable(doc, {
      startY: 50,
      head: [["Code", "Nom", "Catégorie", "Service", "Montant", "État"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`rapport-immobilisations-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  if (chargement) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📊 Rapport des Immobilisations</h1>
            <p className="text-gray-600 mt-2">Générez un rapport PDF complet de vos équipements</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard" className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition">
              ← Dashboard
            </Link>
            <button
              onClick={genererPDF}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              📄 Générer PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Équipements</p>
              <p className="text-3xl font-bold text-blue-600">{immobilisations.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Valeur Totale</p>
              <p className="text-3xl font-bold text-green-600">{formatMontant(immobilisations.reduce((sum, i) => sum + i.montant, 0))}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">En Bon État</p>
              <p className="text-3xl font-bold text-purple-600">{immobilisations.filter(i => i.etat === "Neuf" || i.etat === "Bon état").length}</p>
            </div>
          </div>

          <p className="text-gray-600">
            Cliquez sur "Générer PDF" pour télécharger un rapport complet de toutes vos immobilisations.
          </p>
        </div>
      </div>
    </div>
  );
}