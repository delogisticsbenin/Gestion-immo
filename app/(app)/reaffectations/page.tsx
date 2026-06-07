"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getImmobilisations,
  updateImmobilisation,
  getDevise,
  initEntreprise,
  getServices,
  getPersonnel,
} from "@/app/lib/store";

type Service = { id: string; nom: string };
type PersonnelType = { id: string; nom: string; poste: string; service_id: string };

export default function ReaffectationsPage() {
  const [immobilisations, setImmobilisations] = useState<any[]>([]);
  const [historique, setHistorique] = useState<any[]>([]);
  const [immoSelectionnee, setImmoSelectionnee] = useState<any>(null);
  const [nouveauService, setNouveauService] = useState("");
  const [nouveauPersonnel, setNouveauPersonnel] = useState("");
  const [motif, setMotif] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showHistorique, setShowHistorique] = useState(false);
  const [historiqueImmo, setHistoriqueImmo] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [personnel, setPersonnel] = useState<PersonnelType[]>([]);
  const [devise, setDevise] = useState(getDevise());
  const [chargement, setChargement] = useState(true);

  const chargerDonnees = async () => {
    console.log("🔄 Chargement des données...");
    setChargement(true);
    
    try {
      await initEntreprise();
      setDevise(getDevise());

      const immos = await getImmobilisations();
      console.log("✅ Immobilisations chargées:", immos.length, "équipements");
      setImmobilisations(immos);

      const servicesData = await getServices();
      console.log("✅ Services chargés:", servicesData.length, "services");
      setServices(servicesData);

      const personnelData = await getPersonnel();
      console.log("✅ Personnel chargé:", personnelData.length, "personnes");
      setPersonnel(personnelData);

      const savedHistorique = localStorage.getItem("historiqueReaffectations");
      if (savedHistorique) {
        setHistorique(JSON.parse(savedHistorique));
      }
    } catch (error) {
      console.error("❌ Erreur lors du chargement:", error);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  const handleReaffecter = (immo: any) => {
    console.log("🔄 Réaffectation de:", immo);
    setImmoSelectionnee(immo);
    setNouveauService(immo.service_id || "");
    setNouveauPersonnel("");
    setMotif("");
    setShowModal(true);
  };

  const handleVoirHistorique = (immoId: string) => {
    const hist = historique.filter((h) => h.immoId === immoId);
    setHistoriqueImmo(hist);
    setShowHistorique(true);
  };

  const handleConfirmer = async () => {
    if (!immoSelectionnee || !nouveauService || !nouveauPersonnel || !motif) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    const service = services.find((s) => s.id === nouveauService);
    const personnelItem = personnel.find((p) => p.id === nouveauPersonnel);

    if (!service || !personnelItem) {
      alert("Service ou personnel invalide");
      return;
    }

    const nouvelleEntree = {
      id: `HIST-${Date.now().toString().slice(-3)}`,
      immoId: immoSelectionnee.id,
      immoNom: immoSelectionnee.nom,
      ancienService: immoSelectionnee.service_nom,
      ancienPersonnel: immoSelectionnee.personnel_nom,
      nouveauService: service.nom,
      nouveauPersonnel: personnelItem.nom,
      date: new Date().toISOString().split("T")[0],
      motif: motif,
    };

    const newHistorique = [nouvelleEntree, ...historique];
    setHistorique(newHistorique);
    localStorage.setItem("historiqueReaffectations", JSON.stringify(newHistorique));

    try {
      await updateImmobilisation(immoSelectionnee.id, {
        service_id: nouveauService,
        personnel_id: nouveauPersonnel,
      });

      setShowModal(false);
      setImmoSelectionnee(null);
      await chargerDonnees();
      alert("✅ Réaffectation effectuée avec succès !");
    } catch (error) {
      console.error("Erreur lors de la réaffectation:", error);
      alert("Erreur lors de la réaffectation");
    }
  };

  if (chargement) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🔄 Réaffectations</h1>
            <p className="text-gray-600 mt-2">Gérez les transferts d'équipements entre services et personnels</p>
          </div>
          <Link href="/dashboard" className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition">
            ← Dashboard
          </Link>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Total Réaffectations</h3>
            <p className="text-3xl font-bold text-blue-600">{historique.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Ce mois-ci</h3>
            <p className="text-3xl font-bold text-green-600">
              {historique.filter((h) => {
                const dateHist = new Date(h.date);
                const maintenant = new Date();
                return dateHist.getMonth() === maintenant.getMonth() && dateHist.getFullYear() === maintenant.getFullYear();
              }).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Équipements actifs</h3>
            <p className="text-3xl font-bold text-purple-600">{immobilisations.length}</p>
          </div>
        </div>

        {/* Liste des immobilisations */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">📋 Équipements à réaffecter</h2>
            <p className="text-sm text-gray-600 mt-1">
              Cliquez sur "Réaffecter" pour transférer un équipement
            </p>
          </div>
          {immobilisations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Équipement</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service actuel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Personnel actuel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {immobilisations.map((immo) => (
                    <tr key={immo.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">{immo.code_interne}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{immo.nom}</div>
                        <div className="text-sm text-gray-500">{immo.modele}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{immo.service_nom}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{immo.personnel_nom}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleReaffecter(immo)}
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                        >
                          🔄 Réaffecter
                        </button>
                        <button
                          onClick={() => handleVoirHistorique(immo.id)}
                          className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition"
                        >
                          📜 Historique
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <p className="text-xl mb-2">📭 Aucun équipement</p>
              <p>
                Allez dans{" "}
                <Link href="/immobilisations/ajouter" className="text-blue-600 hover:underline font-semibold">
                  Ajouter
                </Link>{" "}
                pour créer votre premier équipement.
              </p>
            </div>
          )}
        </div>

        {/* Historique global */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">📜 Historique des réaffectations</h2>
          </div>
          <div className="p-6">
            {historique.length > 0 ? (
              <div className="space-y-4">
                {historique.map((hist) => (
                  <div key={hist.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{hist.immoNom}</p>
                        <p className="text-sm text-gray-600">
                          De : <span className="font-medium">{hist.ancienPersonnel}</span> ({hist.ancienService})
                        </p>
                        <p className="text-sm text-gray-600">
                          Vers : <span className="font-medium text-blue-600">{hist.nouveauPersonnel}</span> ({hist.nouveauService})
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Motif : {hist.motif}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{hist.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucune réaffectation enregistrée</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal de réaffectation */}
      {showModal && immoSelectionnee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">🔄 Réaffecter l'équipement</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600">Équipement</p>
              <p className="font-semibold">{immoSelectionnee.nom}</p>
              <p className="text-sm text-gray-600 mt-2">Affectation actuelle</p>
              <p className="font-semibold">
                {immoSelectionnee.personnel_nom} ({immoSelectionnee.service_nom})
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau service *</label>
                <select
                  value={nouveauService}
                  onChange={(e) => {
                    setNouveauService(e.target.value);
                    setNouveauPersonnel("");
                  }}
                  className="w-full border border-gray-300 p-2 rounded-lg"
                >
                  <option value="">-- Choisir un service --</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau personnel *</label>
                <select
                  value={nouveauPersonnel}
                  onChange={(e) => setNouveauPersonnel(e.target.value)}
                  disabled={!nouveauService}
                  className="w-full border border-gray-300 p-2 rounded-lg disabled:bg-gray-100"
                >
                  <option value="">
                    {nouveauService ? "-- Choisir une personne --" : "-- Sélectionnez d'abord un service --"}
                  </option>
                  {personnel
                    .filter((p) => p.service_id === nouveauService)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nom}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motif *</label>
                <textarea
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder="Ex: Mutation, Départ, Casse..."
                  rows={3}
                  className="w-full border border-gray-300 p-2 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 p-3 rounded-lg hover:bg-gray-400 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmer}
                className="flex-1 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
              >
                ✅ Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'historique */}
      {showHistorique && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">📜 Historique de l'équipement</h3>
              <button
                onClick={() => setShowHistorique(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            {historiqueImmo.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {historiqueImmo.map((hist) => (
                  <div key={hist.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <p className="text-sm font-medium text-gray-900">{hist.date}</p>
                    <p className="text-sm text-gray-600">
                      De : {hist.ancienPersonnel} ({hist.ancienService})
                    </p>
                    <p className="text-sm text-gray-600">
                      Vers : {hist.nouveauPersonnel} ({hist.nouveauService})
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Motif : {hist.motif}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucun historique pour cet équipement</p>
            )}
            <button
              onClick={() => setShowHistorique(false)}
              className="w-full mt-4 bg-gray-300 text-gray-700 p-3 rounded-lg hover:bg-gray-400 transition"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}