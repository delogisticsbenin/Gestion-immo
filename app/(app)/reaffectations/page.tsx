"use client";

import { useState, useEffect } from "react";
import { Repeat, Search } from "lucide-react";
import {
  getImmobilisations,
  getServices,
  getPersonnels,
  getHistoriqueReaffectations,
  reaffecterImmobilisation,
} from "@/app/lib/store";
import { getCurrentUser } from "@/app/lib/supabaseClient";
import BoutonsExport from "@/app/components/BoutonsExport";
import { ColonneExport } from "@/app/lib/export";

export default function ReaffectationsPage() {
  const [immobilisations, setImmobilisations] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [personnels, setPersonnels] = useState<any[]>([]);
  const [historique, setHistorique] = useState<any[]>([]);
  const [recherche, setRecherche] = useState("");
  const [filtreService, setFiltreService] = useState("");
  const [chargement, setChargement] = useState(true);
  const [succes, setSucces] = useState("");

  // Modale
  const [modale, setModale] = useState<any | null>(null);
  const [nouveauService, setNouveauService] = useState("");
  const [nouveauPersonnel, setNouveauPersonnel] = useState("");
  const [motif, setMotif] = useState("");
  const [dateEffet, setDateEffet] = useState(new Date().toISOString().split("T")[0]);
  const [commentaire, setCommentaire] = useState("");
  const [traitement, setTraitement] = useState(false);
  const [erreur, setErreur] = useState("");

  const chargerDonnees = async () => {
    setChargement(true);
    const [i, s, p, h] = await Promise.all([
      getImmobilisations(),
      getServices(),
      getPersonnels(),
      getHistoriqueReaffectations(),
    ]);
    setImmobilisations(i);
    setServices(s);
    setPersonnels(p);
    setHistorique(h);
    setChargement(false);
  };

  useEffect(() => { chargerDonnees(); }, []);

  const serviceNom = (id: string) => services.find((s) => s.id === id)?.nom || "—";
  const personnelNom = (id: string) => personnels.find((p) => p.id === id)?.nom || "—";

  // ✅ REA-06 : filtres sur la liste à réaffecter
  const biensFiltres = immobilisations.filter((i) => {
    if (i.statut === "sorti") return false;
    const match =
      i.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      i.code_interne?.toLowerCase().includes(recherche.toLowerCase());
    return match && (!filtreService || i.service_id === filtreService);
  });

  const ouvrirModale = (immo: any) => {
    setModale(immo);
    setNouveauService(immo.service_id || "");
    setNouveauPersonnel(immo.personnel_id || "");
    setMotif("");
    setDateEffet(new Date().toISOString().split("T")[0]);
    setCommentaire("");
    setErreur("");
  };

  const fermerModale = () => setModale(null);

  // ✅ REA-04 : cohérence service ↔ personnel
  const personnelProposes = personnels.filter(
    (p) => !nouveauService || p.service_id === nouveauService
  );

  // ✅ REA-01 + REA-03 : confirmer désactivé si aucun changement ou motif absent
  const aucunChangement =
    nouveauService === (modale?.service_id || "") &&
    nouveauPersonnel === (modale?.personnel_id || "");
  const confirmerPossible = !!modale && motif.trim().length > 0 && !aucunChangement;

  const confirmer = async () => {
    if (!confirmerPossible) return;
    setTraitement(true);
    setErreur("");
    try {
      const user = await getCurrentUser();
      await reaffecterImmobilisation({
        immobilisationId: modale.id,
        nouveauServiceId: nouveauService || null,
        nouveauPersonnelId: nouveauPersonnel || null,
        motif: motif.trim(),
        commentaire: commentaire.trim(),
        auteur: user?.email || "inconnu",
        dateEffet,
      });
      fermerModale();
      await chargerDonnees();
      setSucces(`Réaffectation de ${modale.code_interne} enregistrée.`);
      setTimeout(() => setSucces(""), 4000);
    } catch (e) {
      setErreur("Erreur lors de la réaffectation. Vérifiez la connexion et réessayez.");
    } finally {
      setTraitement(false);
    }
  };

  // ✅ REA-02 : registre des mouvements exportable
  const COL_MOUVEMENTS: ColonneExport[] = [
    { cle: "date", titre: "Date" },
    { cle: "code", titre: "Code" },
    { cle: "bien", titre: "Équipement" },
    { cle: "ancien_service", titre: "Ancien service" },
    { cle: "nouveau_service", titre: "Nouveau service" },
    { cle: "ancien_detenteur", titre: "Ancien détenteur" },
    { cle: "nouveau_detenteur", titre: "Nouveau détenteur" },
    { cle: "motif", titre: "Motif" },
    { cle: "auteur", titre: "Auteur" },
  ];
  const lignesMouvements = historique.map((m) => {
    const immo = immobilisations.find((i) => i.id === m.immobilisation_id);
    return {
      date: (m.date_reaffectation || "").slice(0, 10),
      code: immo?.code_interne || "",
      bien: immo?.nom || "",
      ancien_service: serviceNom(m.ancien_service_id),
      nouveau_service: serviceNom(m.nouveau_service_id),
      ancien_detenteur: personnelNom(m.ancien_personnel_id),
      nouveau_detenteur: personnelNom(m.nouveau_personnel_id),
      motif: m.motif || "",
      auteur: m.auteur || "",
    };
  });

  if (chargement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Repeat className="h-8 w-8 text-blue-600" /> Réaffectations
        </h1>
        <p className="text-gray-600">Transferts d'équipements entre services et personnels, avec registre complet.</p>
      </div>

      {succes && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">✓ {succes}</div>
      )}

      {/* Liste des équipements à réaffecter */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Code ou nom..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service actuel</label>
            <select
              value={filtreService}
              onChange={(e) => setFiltreService(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Code</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Équipement</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Service actuel</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Détenteur actuel</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {biensFiltres.map((immo) => (
                <tr key={immo.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-blue-600 font-medium">{immo.code_interne}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{immo.nom}</td>
                  <td className="py-3 px-4 text-gray-600">{serviceNom(immo.service_id)}</td>
                  <td className="py-3 px-4 text-gray-600">{personnelNom(immo.personnel_id)}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => ouvrirModale(immo)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                    >
                      🔄 Réaffecter
                    </button>
                  </td>
                </tr>
              ))}
              {biensFiltres.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-500">Aucun équipement à réaffecter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ REA-02 : registre des mouvements */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">📒 Registre des mouvements</h2>
          <BoutonsExport nomFichier="mouvements" lignes={lignesMouvements} colonnes={COL_MOUVEMENTS} nomFeuille="Mouvements" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Équipement</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Ancien → Nouveau service</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Ancien → Nouveau détenteur</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Motif</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Auteur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {historique.map((m) => {
                const immo = immobilisations.find((i) => i.id === m.immobilisation_id);
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-600">{(m.date_reaffectation || "").slice(0, 10)}</td>
                    <td className="py-3 px-4">
                      <p className="font-mono text-blue-600 text-xs">{immo?.code_interne}</p>
                      <p className="font-medium text-gray-900">{immo?.nom}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{serviceNom(m.ancien_service_id)} → {serviceNom(m.nouveau_service_id)}</td>
                    <td className="py-3 px-4 text-gray-600">{personnelNom(m.ancien_personnel_id)} → {personnelNom(m.nouveau_personnel_id)}</td>
                    <td className="py-3 px-4 text-gray-600">{m.motif || "—"}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{m.auteur || "—"}</td>
                  </tr>
                );
              })}
              {historique.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-gray-500">Aucun mouvement enregistré.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modale de réaffectation */}
      {modale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Réaffecter {modale.code_interne}</h2>
            <p className="text-sm text-gray-500 mb-4">{modale.nom}</p>

            {erreur && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">⛔ {erreur}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau service</label>
                <select
                  value={nouveauService}
                  onChange={(e) => { setNouveauService(e.target.value); setNouveauPersonnel(""); }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Conserver : {serviceNom(modale.service_id)}</option>
                  {services.filter((s) => s.id !== modale.service_id).map((s) => (
                    <option key={s.id} value={s.id}>{s.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau détenteur</label>
                <select
                  value={nouveauPersonnel}
                  onChange={(e) => setNouveauPersonnel(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Conserver : {personnelNom(modale.personnel_id)}</option>
                  {personnelProposes.filter((p) => p.id !== modale.personnel_id).map((p) => (
                    <option key={p.id} value={p.id}>{p.nom}{p.service_id ? ` (${serviceNom(p.service_id)})` : ""}</option>
                  ))}
                </select>
                {nouveauService && personnelProposes.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">Aucune personne dans ce service : le bien restera sans détenteur.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Motif * (obligatoire)</label>
                <input
                  type="text"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder="Ex. déménagement du service, départ du salarié..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date d'effet</label>
                <input
                  type="date"
                  value={dateEffet}
                  onChange={(e) => setDateEffet(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire (optionnel)</label>
                <textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {aucunChangement && (
                <p className="text-xs text-gray-500">Sélectionnez au moins un changement pour activer la confirmation.</p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={fermerModale}
                disabled={traitement}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmer}
                disabled={!confirmerPossible || traitement}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {traitement ? "Enregistrement..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}