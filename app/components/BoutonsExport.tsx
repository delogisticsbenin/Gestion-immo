"use client";

import { FileText, FileSpreadsheet } from "lucide-react";
import { exporterCSV, exporterXLSX, ColonneExport } from "@/app/lib/export";

export default function BoutonsExport({
  nomFichier,
  lignes,
  colonnes,
  nomFeuille = "Export",
}: {
  nomFichier: string;
  lignes: Record<string, any>[];
  colonnes: ColonneExport[];
  nomFeuille?: string;
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => exporterCSV(nomFichier, lignes, colonnes)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
      >
        <FileText className="h-4 w-4" /> CSV
      </button>
      <button
        onClick={() => exporterXLSX(nomFichier, lignes, colonnes, nomFeuille)}
        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
      >
        <FileSpreadsheet className="h-4 w-4" /> XLSX
      </button>
    </div>
  );
}