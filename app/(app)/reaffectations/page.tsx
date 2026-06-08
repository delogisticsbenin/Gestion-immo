"use client";

import { useState, useEffect } from "react";
import {
  getImmobilisations,
  updateImmobilisation,
  getDevise,
  initEntreprise,
  getServices,
  getPersonnels,
  formatMontant
} from "@/app/lib/store";

type Service = { id: string; nom: string };
type PersonnelType = { id: string; nom: string; poste?: string; service_id?: string };

export default function ReaffectationsPage() {
  const [immobilisations, setImmobilisations] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [personnels, setPersonnels] = useState<PersonnelType[]>([]);
  const [chargement, setChargement] = useState(true);
  const [selectedImmo, setSelectedImmo] = useState<any>(null);
  const [nouveauService, setNouveauService] = useState("");
  const [nouveauPersonnel, setNouveauPersonnel] = useState("");

  useEffect(() => {
    initEntreprise();
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    const data = await getImmobilisations();
    const servicesData = await getServices();
    const personnelsData = await getPersonnels();
    setImmobilisations(data);
    setServices(servicesData);
    setPersonnels(personnelsData);
    setChargement(false);
  };

  const handleReaffecter = async () => {
    if (!selectedImmo) return;
    
    await updateImmobilisation(selectedImmo.id, {
      service_id: nouveauService || selectedImmo.service_id,
      personnel_id: nouveauPersonnel || selectedImmo.personnel_id
    });

    alert("Réaffectation réussie !");
    setSelectedImmo(null);
    setNouveauService("");
    setNouveauPersonnel("");
    chargerDonnees();
  };

  if (chargement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🔄 Réaffectations</h1>
        <p className="text-gray-600">Transférer des équipements entre services ou personnels</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Code</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Nom</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Service actuel</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Personnel actuel</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {immobilisations.map((immo: any) => (
                <tr key={immo.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-mono text-blue-600">{immo.code_interne}</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{immo.nom}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {services.find(s => s.id === immo.service_id)?.nom || 'Non affecté'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {personnels.find(p => p.id === immo.personnel_id)?.nom || 'Non affecté'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <button
                      onClick={() => setSelectedImmo(immo)}
                      className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                    >
                      🔄 Réaffecter
                    </button>
                  </td>
                </tr>
              ))}
              {immobilisations.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    Aucun équipement à réaffecter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedImmo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Réaffecter : {selectedImmo.nom}
            </h2>
            <p className="text-sm text-gray-600 mb-6">Code : {selectedImmo.code_interne}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau service</label>
                <select
                  value={nouveauService}
                  onChange={(e) => setNouveauService(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Conserver le service actuel</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau personnel</label>
                <select
                  value={nouveauPersonnel}
                  onChange={(e) => setNouveauPersonnel(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Conserver le personnel actuel</option>
                  {personnels.map((p) => (
                    <option key={p.id} value={p.id}>{p.nom}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleReaffecter}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                ✅ Confirmer
              </button>
              <button
                onClick={() => {
                  setSelectedImmo(null);
                  setNouveauService("");
                  setNouveauPersonnel("");
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}