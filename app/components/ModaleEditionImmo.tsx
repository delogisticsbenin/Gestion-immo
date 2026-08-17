"use client";

import { useState, useEffect } from "react";
import { getCategories, updateImmobilisation, ajouterAuJournal } from "@/app/lib/store";
import { getCurrentUser } from "@/app/lib/supabaseClient";

const ETATS = ["Neuf", "Bon état", "Usagé", "En panne"];

export default function ModaleEditionImmo({
  immo,
  onClose,
  onSaved,
}: {
  immo: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  // Champs descriptifs (libres)
  const [nom, setNom] = useState(immo.nom || "");
  const [modele, setModele] = useState(immo.modele || "");
  const [numeroSerie, setNumeroSerie] = useState(immo.numero_serie || "");
  const [etat, setEtat] = useState(immo.etat || "Neuf");
  const [localisation, setLocalisation] = useState(immo.localisation || "");
  const [description, setDescription] = useState(immo.description || "");

  // Champs comptables (tracés)
  const [montant, setMontant] = useState(String(immo.montant ?? ""));
  const [dateAcquisition, setDateAcquisition] = useState((immo.date_acquisition || "").slice(0, 10));
  const [categorie, setCategorie] = useState(immo.categorie || "");
  const [duree, setDuree] = useState(String(immo.annee_amortissement ?? ""));

  const [categories, setCategories] = useState<any[]>([]);
  const [erreur, setErreur] = useState("");
  const [traitement, setTraitement] = useState(false);

  useEffect(() => { getCategories().then(setCategories); }, []);

  // ✅ IMM-09 : validation à la saisie
  const valider = () => {
    if (nom.trim().length < 3) return "Le nom doit contenir au moins 3 caractères.";
    const m = Number(montant);
    if (!m || m <= 0) return "Le montant doit être strictement positif.";
    if (!dateAcquisition) return "La date d'acquisition est obligatoire.";
    if (new Date(dateAcquisition) > new Date()) return "La date d'acquisition ne peut pas être postérieure à aujourd'hui.";
    if (!categorie) return "La catégorie est obligatoire.";
    return "";
  };

  const enregistrer = async () => {
    const probleme = valider();
    if (probleme) { setErreur(probleme); return; }
    setTraitement(true);
    setErreur("");
    try {
      const user = await getCurrentUser();
      const auteur = user?.email || "inconnu";

      // ✅ IMM-03 : traçage des champs comptables modifiés
      const changements = [
        { champ: "montant", ancien: String(immo.montant ?? ""), nouveau: String(Number(montant)) },
        { champ: "date_acquisition", ancien: (immo.date_acquisition || "").slice(0, 10), nouveau: dateAcquisition },
        { champ: "categorie", ancien: immo.categorie || "", nouveau: categorie },
        { champ: "annee_amortissement", ancien: String(immo.annee_amortissement ?? ""), nouveau: duree },
      ].filter((c) => c.ancien !== c.nouveau);

      for (const c of changements) {
        await ajouterAuJournal({
          table_concernee: "immobilisations",
          enregistrement_id: immo.id,
          champ: c.champ,
          ancienne_valeur: c.ancien,
          nouvelle_valeur: c.nouveau,
          auteur,
        });
      }

      await updateImmobilisation(immo.id, {
        nom: nom.trim(),
        modele: modele.trim() || null,
        numero_serie: numeroSerie.trim() || null,
        etat,
        localisation: localisation.trim() || null,
        description: description.trim() || null,
        montant: Number(montant),
        date_acquisition: dateAcquisition,
        categorie,
        annee_amortissement: duree ? Number(duree) : null,
      } as any);

      onSaved();
    } catch (e) {
      setErreur("Erreur lors de l'enregistrement. Vérifiez la connexion.");
    } finally {
      setTraitement(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Modifier {immo.code_interne}</h2>
        <p className="text-sm text-gray-500 mb-4">
          Les champs comptables modifiés sont journalisés (auteur, date, ancienne valeur).
        </p>

        {erreur && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">⛔ {erreur}</div>
        )}

        {/* Niveau 1 : descriptif libre */}
        <h3 className="font-semibold text-gray-900 mb-3">Informations descriptives</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input type="text" value={nom} onChange={(e) => setNom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modèle</label>
            <input type="text" value={modele} onChange={(e) => setModele(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">N° de série</label>
            <input type="text" value={numeroSerie} onChange={(e) => setNumeroSerie(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">État physique</label>
            <select value={etat} onChange={(e) => setEtat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              {ETATS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Localisation</label>
            <input type="text" value={localisation} onChange={(e) => setLocalisation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Niveau 2 : comptable tracé */}
        <h3 className="font-semibold text-gray-900 mb-3">Données comptables <span className="text-xs font-normal text-gray-500">(modifications tracées)</span></h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant (valeur brute) *</label>
            <input type="number" min="1" value={montant} onChange={(e) => setMontant(e.target.value)}
              className="w-full px-3 py-2 border border-yellow-300 bg-yellow-50 rounded-lg focus:ring-2 focus:ring-yellow-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'acquisition *</label>
            <input type="date" value={dateAcquisition} onChange={(e) => setDateAcquisition(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 border border-yellow-300 bg-yellow-50 rounded-lg focus:ring-2 focus:ring-yellow-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
            <select value={categorie} onChange={(e) => setCategorie(e.target.value)}
              className="w-full px-3 py-2 border border-yellow-300 bg-yellow-50 rounded-lg focus:ring-2 focus:ring-yellow-500">
              <option value="">Choisir...</option>
              {categories.map((c) => <option key={c.id} value={c.nom}>{c.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durée d'utilité (années)</label>
            <input type="number" min="1" max="50" value={duree} onChange={(e) => setDuree(e.target.value)}
              className="w-full px-3 py-2 border border-yellow-300 bg-yellow-50 rounded-lg focus:ring-2 focus:ring-yellow-500" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} disabled={traitement}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50">
            Annuler
          </button>
          <button onClick={enregistrer} disabled={traitement}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50">
            {traitement ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}