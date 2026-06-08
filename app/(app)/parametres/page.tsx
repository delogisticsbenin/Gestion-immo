"use client";

import { useState, useEffect } from "react";
import { 
  getEntrepriseData, 
  updateEntrepriseData,
  DEVISES,
  saveDevise,
  getServices,
  addService,
  deleteService,
  getPersonnels,
  addPersonnel,
  deletePersonnel
} from "@/app/lib/store";

export default function ParametresPage() {
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [couleurPrincipale, setCouleurPrincipale] = useState("#1e3a8a");
  const [logo, setLogo] = useState("");
  const [devise, setDevise] = useState("FCFA");
  const [sauvegarde, setSauvegarde] = useState(false);

  const [services, setServices] = useState<any[]>([]);
  const [personnels, setPersonnels] = useState<any[]>([]);
  const [nouveauService, setNouveauService] = useState("");
  const [nouveauPersonnel, setNouveauPersonnel] = useState({ nom: "", poste: "", service_id: "" });

  useEffect(() => {
    const data = getEntrepriseData();
    setNomEntreprise(data.nom);
    setCouleurPrincipale(data.couleurPrincipale);
    setLogo(data.logo);
    setDevise(data.devise);

    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    const servicesData = await getServices();
    const personnelsData = await getPersonnels();
    setServices(servicesData);
    setPersonnels(personnelsData);
  };

  const handleSaveEntreprise = () => {
    updateEntrepriseData({
      nom: nomEntreprise,
      couleurPrincipale,
      logo,
      devise
    });
    saveDevise(devise);
    setSauvegarde(true);
    setTimeout(() => setSauvegarde(false), 3000);
  };

  const handleAddService = async () => {
    if (!nouveauService.trim()) return;
    await addService({ nom: nouveauService });
    setNouveauService("");
    chargerDonnees();
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Supprimer ce service ?")) return;
    await deleteService(id);
    chargerDonnees();
  };

  const handleAddPersonnel = async () => {
    if (!nouveauPersonnel.nom.trim()) return;
    await addPersonnel(nouveauPersonnel);
    setNouveauPersonnel({ nom: "", poste: "", service_id: "" });
    chargerDonnees();
  };

  const handleDeletePersonnel = async (id: string) => {
    if (!confirm("Supprimer ce personnel ?")) return;
    await deletePersonnel(id);
    chargerDonnees();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Paramètres</h1>
        <p className="text-gray-600">Personnalisez votre application</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {sauvegarde && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            ✓ Paramètres enregistrés avec succès !
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">🏢 Entreprise</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'entreprise</label>
              <input
                type="text"
                value={nomEntreprise}
                onChange={(e) => setNomEntreprise(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Dé Logistics"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Couleur principale</label>
              <div className="flex gap-4">
                <input
                  type="color"
                  value={couleurPrincipale}
                  onChange={(e) => setCouleurPrincipale(e.target.value)}
                  className="w-20 h-12 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={couleurPrincipale}
                  onChange={(e) => setCouleurPrincipale(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo (URL)</label>
              <input
                type="text"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
              {logo && <img src={logo} alt="Aperçu" className="mt-4 w-32 h-32 object-cover rounded-lg border" />}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Devise</label>
              <select
                value={devise}
                onChange={(e) => setDevise(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {DEVISES.map((d) => (
                  <option key={d.code} value={d.code}>{d.nom}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSaveEntreprise}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              💾 Enregistrer
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">🏢 Services</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={nouveauService}
              onChange={(e) => setNouveauService(e.target.value)}
              placeholder="Nom du service"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddService}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              ➕ Ajouter
            </button>
          </div>
          <div className="space-y-2">
            {services.map((service) => (
              <div key={service.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">{service.nom}</span>
                <button
                  onClick={() => handleDeleteService(service.id)}
                  className="px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                >
                  🗑️ Supprimer
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">👥 Personnel</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
            <input
              type="text"
              value={nouveauPersonnel.nom}
              onChange={(e) => setNouveauPersonnel({ ...nouveauPersonnel, nom: e.target.value })}
              placeholder="Nom complet"
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={nouveauPersonnel.poste}
              onChange={(e) => setNouveauPersonnel({ ...nouveauPersonnel, poste: e.target.value })}
              placeholder="Poste"
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={nouveauPersonnel.service_id}
              onChange={(e) => setNouveauPersonnel({ ...nouveauPersonnel, service_id: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Service</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.nom}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddPersonnel}
            className="w-full mb-4 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            ➕ Ajouter personnel
          </button>
          <div className="space-y-2">
            {personnels.map((p) => (
              <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{p.nom}</p>
                  <p className="text-sm text-gray-600">{p.poste || 'Non spécifié'}</p>
                </div>
                <button
                  onClick={() => handleDeletePersonnel(p.id)}
                  className="px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}