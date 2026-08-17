"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { FileUp, Download, FileSpreadsheet, FileWarning } from "lucide-react";
import {
  getServices,
  getPersonnels,
  importImmobilisations,
} from "@/app/lib/store";
import { toast } from "@/app/components/Toasts";

const ETATS = ["Neuf", "Bon état", "Usagé", "En panne"];

const norm = (s: any) => s.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

// En-têtes acceptés (flexibles) pour chaque champ
const SYNONYMES: Record<string, string[]> = {
  code_interne: ["code", "code interne", "reference", "ref"],
  nom: ["nom", "designation", "equipement", "libelle"],
  categorie: ["categorie", "type"],
  modele: ["modele", "marque"],
  numero_serie: ["n serie", "numero de serie", "numero serie", "serie"],
  etat: ["etat"],
  montant: ["montant", "valeur", "valeur brute", "prix", "cout", "montant (fcfa)"],
  date_acquisition: ["date acquisition", "date d acquisition", "date achat", "acquisition"],
  annee_amortissement: ["duree", "duree utilite", "duree (annees)", "duree de vie"],
  service: ["service", "affectation"],
  personnel: ["detenteur", "personnel", "utilisateur", "affecte a"],
};

const valeurLigne = (ligne: any, champ: string): any => {
  for (const [cle, v] of Object.entries(ligne)) {
    if ((SYNONYMES[champ] || []).includes(norm(cle))) return v;
  }
  return "";
};

const parseDate = (v: any): string => {
  if (v === "" || v == null) return "";
  if (typeof v === "number") {
    return new Date(Math.round((v - 25569) * 86400000)).toISOString().slice(0, 10);
  }
  const s = v.toString().trim();
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return "";
};

export default function ImportPage() {
  const [services, setServices] = useState<any[]>([]);
  const [personnels, setPersonnels] = useState<any[]>([]);
  const [lignes, setLignes] = useState<any[]>([]);
  const [nomFichier, setNomFichier] = useState("");
  const [traitement, setTraitement] = useState(false);

  useEffect(() => {
    (async () => {
      setServices(await getServices());
      setPersonnels(await getPersonnels());
    })();
  }, []);

  // Modèle Excel à télécharger
  const telechargerModele = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Code", "Nom", "Catégorie", "Modèle", "N° série", "État", "Montant", "Date acquisition", "Durée (années)", "Service", "Détenteur"],
      ["", "Imprimante Epson", "Matériel informatique", "L320", "SN123", "Bon état", 85000, "15/03/2024", 3, "Comptabilité", "AGBOSSODE Stéphanie"],
      ["", "Bureau de direction", "Mobilier de bureau", "", "", "Usagé", 150000, "01/06/2021", 10, "Direction", ""],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modèle");
    XLSX.writeFile(wb, "modele-import-immobilisations.xlsx");
  };

  // Lecture du fichier Excel / CSV
  const lireFichier = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setNomFichier(f.name);
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const brut = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const analysees = brut.map((row) => {
        const nom = valeurLigne(row, "nom").toString().trim();
        const montant = Number(valeurLigne(row, "montant"));
        const etatBrut = norm(valeurLigne(row, "etat"));
        const etat = ETATS.find((x) => norm(x) === etatBrut) || "Bon état";
        const serviceTxt = valeurLigne(row, "service").toString().trim();
        const personnelTxt = valeurLigne(row, "personnel").toString().trim();
        const service = services.find((s) => norm(s.nom) === norm(serviceTxt)) || null;
        const personnel = personnels.find((p) => norm(p.nom) === norm(personnelTxt)) || null;

        let probleme = "";
        if (!nom) probleme = "Nom manquant";
        else if (!montant || montant <= 0) probleme = "Montant invalide";

        return {
          code: valeurLigne(row, "code_interne").toString().trim(),
          nom,
          categorie: valeurLigne(row, "categorie").toString().trim() || "Autre",
          modele: valeurLigne(row, "modele").toString().trim(),
          numero_serie: valeurLigne(row, "numero_serie").toString().trim(),
          etat,
          montant,
          date_acquisition: parseDate(valeurLigne(row, "date_acquisition")),
          duree: Number(valeurLigne(row, "annee_amortissement")) || 0,
          serviceTxt,
          personnelTxt,
          service_id: service?.id || null,
          personnel_id: personnel?.id || null,
          avertissement:
            (serviceTxt && !service ? `Service « ${serviceTxt} » inconnu → non affecté. ` : "") +
            (personnelTxt && !personnel ? `Détenteur « ${personnelTxt} » inconnu → non affecté.` : ""),
          probleme,
        };
      });

      setLignes(analysees);
      const ok = analysees.filter((l) => !l.probleme).length;
      toast(`Fichier lu : ${ok} ligne(s) valide(s), ${analysees.length - ok} en erreur.`, ok ? "info" : "erreur");
    } catch {
      toast("Fichier illisible. Utilisez le modèle Excel ou un CSV.", "erreur");
    }
  };

  const confirmerImport = async () => {
    const valides = lignes.filter((l) => !l.probleme);
    if (!valides.length) { toast("Aucune ligne valide à importer.", "erreur"); return; }
    setTraitement(true);
    try {
      const annee = new Date().getFullYear() % 100;
      const payload = valides.map((l, idx) => ({
        code_interne: l.code || `IMP-${annee}-${String(idx + 1).padStart(4, "0")}`,
        categorie: l.categorie,
        nom: l.nom,
        modele: l.modele || null,
        numero_serie: l.numero_serie || null,
        etat: l.etat,
        montant: l.montant,
        date_acquisition: l.date_acquisition || new Date().toISOString().slice(0, 10),
        annee_amortissement: l.duree || null,
        service_id: l.service_id,
        personnel_id: l.personnel_id,
        statut: "en_service",
      }));
      await importImmobilisations(payload);
      toast(`${payload.length} équipement(s) importé(s) avec succès.`, "succes");
      setLignes([]);
      setNomFichier("");
    } catch {
      toast("Échec de l'import. Vérifiez les données et réessayez.", "erreur");
    } finally {
      setTraitement(false);
    }
  };

  const nbValides = lignes.filter((l) => !l.probleme).length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <FileUp className="h-8 w-8 text-blue-600" /> Import des anciens équipements
        </h1>
        <p className="text-gray-600">Reprenez l'existant depuis un fichier Excel ou CSV, avec contrôle avant intégration.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Étape 1 : modèle */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" /> 1. Télécharger le modèle
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Le modèle liste les colonnes reconnues (les en-têtes approchants sont acceptés : « Désignation », « Valeur », « Marque »…).
          </p>
          <button
            onClick={telechargerModele}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            <Download className="h-5 w-5" /> Modèle Excel
          </button>
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
            <FileWarning className="h-5 w-5 text-yellow-600 shrink-0" />
            <p className="text-sm text-yellow-800">
              <strong>PDF :</strong> import direct non fiable. Ouvrez le PDF, copiez le tableau dans Excel (ou le modèle), puis importez le fichier .xlsx/.csv.
            </p>
          </div>
        </div>

        {/* Étape 2 : fichier */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <FileUp className="h-5 w-5 text-blue-600" /> 2. Choisir le fichier
          </h2>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={lireFichier}
            className="w-full text-sm text-gray-600 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium file:cursor-pointer hover:file:bg-blue-100"
          />
          {nomFichier && <p className="text-sm text-gray-500 mt-2">Fichier chargé : {nomFichier}</p>}
        </div>
      </div>

      {/* Étape 3 : aperçu + confirmation */}
      {lignes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-900">3. Vérifier puis importer</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-green-700 font-medium">{nbValides} valide(s)</span>
              <span className="text-sm text-red-600 font-medium">{lignes.length - nbValides} en erreur</span>
              <button
                onClick={confirmerImport}
                disabled={traitement || nbValides === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-40"
              >
                {traitement ? "Import en cours..." : `Importer ${nbValides} équipement(s)`}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase">Statut</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase">Nom</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase">Catégorie</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 uppercase">Montant</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase">Acquisition</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase">Service / Détenteur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {lignes.map((l, i) => (
                  <tr key={i} className={l.probleme ? "bg-red-50" : ""}>
                    <td className="py-2 px-3">
                      {l.probleme ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">{l.probleme}</span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">OK</span>
                      )}
                      {l.avertissement && <p className="text-xs text-orange-600 mt-1">{l.avertissement}</p>}
                    </td>
                    <td className="py-2 px-3 font-medium text-gray-900">{l.nom || "—"}</td>
                    <td className="py-2 px-3 text-gray-600">{l.categorie}</td>
                    <td className="py-2 px-3 text-right text-gray-900">{l.montant || "—"}</td>
                    <td className="py-2 px-3 text-gray-600">{l.date_acquisition || "(aujourd'hui)"}</td>
                    <td className="py-2 px-3 text-gray-600">{l.serviceTxt || "—"} / {l.personnelTxt || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}