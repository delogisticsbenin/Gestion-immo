"use client";

import { useState, useEffect } from "react";
import OngletUtilisateurs from "@/app/components/OngletUtilisateurs";
import { toast } from "@/app/components/Toasts";
import { 
  getEntrepriseData, 
  updateEntrepriseData,
  DEVISES,
  saveDevise,
  getServices,
  addService,
  updateService,
  deleteService,
  getPersonnels,
  addPersonnel,
  updatePersonnel,
  deletePersonnel,
  getCategories,
  addCategorie,
  updateCategorie,
  deleteCategorie,
  getDateCloture,
  setDateCloture,
  countImmobilisationsParService,
  countImmobilisationsParPersonnel,
  televerserLogo
} from "@/app/lib/store";

type Onglet = 'entreprise' | 'categories' | 'services' | 'personnel' | 'utilisateurs';

export default function ParametresPage() {
  const [ongletActif, setOngletActif] = useState<Onglet>('entreprise');

  // Entreprise
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [couleurPrincipale, setCouleurPrincipale] = useState("#1e3a8a");
  const [logo, setLogo] = useState("");
  const [devise, setDevise] = useState("FCFA");
  const [dateCloture, setDateClotureState] = useState("31/12");
  const [sauvegarde, setSauvegarde] = useState(false);
  const [erreur, setErreur] = useState("");

  // Catégories
  const [categories, setCategories] = useState<any[]>([]);
  const [nouvelleCategorie, setNouvelleCategorie] = useState<{
    nom: string;
    duree_utilite: number;
    methode_amortissement: "lineaire" | "degressif";
  }>({ nom: "", duree_utilite: 5, methode_amortissement: "lineaire" });

  // Services
  const [services, setServices] = useState<any[]>([]);
  const [nouveauService, setNouveauService] = useState("");
  const [serviceEnEdition, setServiceEnEdition] = useState<string | null>(null);
  const [nomServiceEdition, setNomServiceEdition] = useState("");

  // Personnel
  const [personnels, setPersonnels] = useState<any[]>([]);
  const [nouveauPersonnel, setNouveauPersonnel] = useState({ nom: "", poste: "", service_id: "" });
  const [personnelEnEdition, setPersonnelEnEdition] = useState<string | null>(null);
  const [personnelEdition, setPersonnelEdition] = useState({ nom: "", poste: "", service_id: "" });

  useEffect(() => {
    const data = getEntrepriseData();
    setNomEntreprise(data.nom);
    setCouleurPrincipale(data.couleurPrincipale);
    setLogo(data.logo);
    setDevise(data.devise);
    setDateClotureState(getDateCloture());
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    const categoriesData = await getCategories();
    const servicesData = await getServices();
    const personnelsData = await getPersonnels();
    setCategories(categoriesData);
    setServices(servicesData);
    setPersonnels(personnelsData);
  };

  // === ENTREPRISE ===
  const handleSaveEntreprise = () => {
    updateEntrepriseData({ nom: nomEntreprise, couleurPrincipale, logo, devise });
    saveDevise(devise);
    setDateCloture(dateCloture);
    setSauvegarde(true);
    setTimeout(() => setSauvegarde(false), 3000);
  };

  // ✅ PAR-04 : téléversement du logo
  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const url = await televerserLogo(f);
      setLogo(url);
      toast("Logo téléversé. Cliquez sur « Enregistrer ».", "succes");
    } catch {
      toast("Échec du téléversement du logo.", "erreur");
    }
  };

  // === CATÉGORIES (PAR-01) ===
  const handleAddCategorie = async () => {
    if (!nouvelleCategorie.nom.trim()) return;
    await addCategorie(nouvelleCategorie);
    setNouvelleCategorie({ nom: "", duree_utilite: 5, methode_amortissement: "lineaire" });
    chargerDonnees();
  };

  const handleUpdateCategorie = async (id: string, updates: Partial<any>) => {
    await updateCategorie(id, updates);
    chargerDonnees();
  };

  const handleDeleteCategorie = async (id: string) => {
    if (!confirm("Supprimer cette catégorie ?")) return;
    await deleteCategorie(id);
    chargerDonnees();
  };

  // === SERVICES (SER-01 édition, SER-02 suppression protégée) ===
  const handleAddService = async () => {
    if (!nouveauService.trim()) return;
    await addService({ nom: nouveauService });
    setNouveauService("");
    chargerDonnees();
  };

  const handleEditService = (id: string, nom: string) => {
    setServiceEnEdition(id);
    setNomServiceEdition(nom);
  };

  const handleSaveService = async (id: string) => {
    if (!nomServiceEdition.trim()) return;
    await updateService(id, { nom: nomServiceEdition });
    setServiceEnEdition(null);
    setNomServiceEdition("");
    chargerDonnees();
  };

  const handleDeleteService = async (id: string) => {
    const nb = await countImmobilisationsParService(id);
    if (nb > 0) {
      setErreur(`Suppression impossible : ${nb} équipement(s) rattaché(s) à ce service. Réaffectez-les d'abord via le module Réaffectations.`);
      return;
    }
    if (!confirm("Supprimer ce service ?")) return;
    setErreur("");
    await deleteService(id);
    chargerDonnees();
  };

  // === PERSONNEL (PER-02 édition, PER-01 suppression protégée) ===
  const handleAddPersonnel = async () => {
    if (!nouveauPersonnel.nom.trim()) return;
    await addPersonnel(nouveauPersonnel);
    setNouveauPersonnel({ nom: "", poste: "", service_id: "" });
    chargerDonnees();
  };

  const handleEditPersonnel = (id: string, data: any) => {
    setPersonnelEnEdition(id);
    setPersonnelEdition({ nom: data.nom, poste: data.poste || "", service_id: data.service_id || "" });
  };

  const handleSavePersonnel = async (id: string) => {
    if (!personnelEdition.nom.trim()) return;
    await updatePersonnel(id, personnelEdition);
    setPersonnelEnEdition(null);
    setPersonnelEdition({ nom: "", poste: "", service_id: "" });
    chargerDonnees();
  };

  const handleDeletePersonnel = async (id: string) => {
    const nb = await countImmobilisationsParPersonnel(id);
    if (nb > 0) {
      setErreur(`Suppression impossible : ${nb} équipement(s) détenu(s) par cette personne. Réaffectez-les d'abord.`);
      return;
    }
    if (!confirm("Supprimer cette personne ?")) return;
    setErreur("");
    await deletePersonnel(id);
    chargerDonnees();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Paramètres</h1>
        <p className="text-gray-600">Personnalisez votre application</p>
      </div>

      {sauvegarde && (
        <div className="max-w-4xl mx-auto mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          ✓ Paramètres enregistrés avec succès !
        </div>
      )}

      {erreur && (
        <div className="max-w-4xl mx-auto mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ⛔ {erreur}
        </div>
      )}

      {/* Onglets */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex gap-2 border-b border-gray-200 flex-wrap">
          <button
            onClick={() => setOngletActif('entreprise')}
            className={`px-6 py-3 font-medium transition ${
              ongletActif === 'entreprise'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🏢 Entreprise
          </button>
          <button
            onClick={() => setOngletActif('categories')}
            className={`px-6 py-3 font-medium transition ${
              ongletActif === 'categories'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Catégories et amortissements
          </button>
          <button
            onClick={() => setOngletActif('services')}
            className={`px-6 py-3 font-medium transition ${
              ongletActif === 'services'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🏢 Services
          </button>
          <button
            onClick={() => setOngletActif('personnel')}
            className={`px-6 py-3 font-medium transition ${
              ongletActif === 'personnel'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            👥 Personnel
          </button>
          <button
            onClick={() => setOngletActif('utilisateurs')}
            className={`px-6 py-3 font-medium transition ${
              ongletActif === 'utilisateurs'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            👤 Utilisateurs
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Onglet Entreprise */}
        {ongletActif === 'entreprise' && (
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                {/* ✅ PAR-04 : téléversement d'un fichier image */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadLogo}
                  className="w-full text-sm text-gray-600 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium file:cursor-pointer hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">…ou collez une URL ci-dessous.</p>
                <input
                  type="text"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date de clôture d'exercice</label>
                <input
                  type="text"
                  value={dateCloture}
                  onChange={(e) => setDateClotureState(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="31/12"
                />
                <p className="text-xs text-gray-500 mt-1">Format JJ/MM (par défaut : 31/12)</p>
              </div>

              <button
                onClick={handleSaveEntreprise}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                💾 Enregistrer
              </button>
            </div>
          </div>
        )}

        {/* Onglet Catégories */}
        {ongletActif === 'categories' && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">📊 Catégories et amortissements</h2>
            <p className="text-sm text-gray-600 mb-6">
              Durées d'utilité et méthodes d'amortissement conformes au SYSCOHADA révisé.
            </p>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Ajouter une catégorie</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <input
                  type="text"
                  value={nouvelleCategorie.nom}
                  onChange={(e) => setNouvelleCategorie({ ...nouvelleCategorie, nom: e.target.value })}
                  placeholder="Nom de la catégorie"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  value={nouvelleCategorie.duree_utilite}
                  onChange={(e) => setNouvelleCategorie({ ...nouvelleCategorie, duree_utilite: parseInt(e.target.value) || 1 })}
                  min="1"
                  max="50"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={nouvelleCategorie.methode_amortissement}
                  onChange={(e) => setNouvelleCategorie({ ...nouvelleCategorie, methode_amortissement: e.target.value as "lineaire" | "degressif" })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="lineaire">Linéaire</option>
                  <option value="degressif">Dégressif</option>
                </select>
              </div>
              <button
                onClick={handleAddCategorie}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                ➕ Ajouter
              </button>
            </div>

            <div className="space-y-3">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={cat.nom}
                      onChange={(e) => handleUpdateCategorie(cat.id, { nom: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      value={cat.duree_utilite}
                      onChange={(e) => handleUpdateCategorie(cat.id, { duree_utilite: parseInt(e.target.value) || 1 })}
                      min="1"
                      max="50"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={cat.methode_amortissement}
                      onChange={(e) => handleUpdateCategorie(cat.id, { methode_amortissement: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="lineaire">Linéaire</option>
                      <option value="degressif">Dégressif</option>
                    </select>
                  </div>
                  <button
                    onClick={() => handleDeleteCategorie(cat.id)}
                    className="ml-4 px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Onglet Services */}
        {ongletActif === 'services' && (
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
                  {serviceEnEdition === service.id ? (
                    <>
                      <input
                        type="text"
                        value={nomServiceEdition}
                        onChange={(e) => setNomServiceEdition(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleSaveService(service.id)}
                        className="ml-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setServiceEnEdition(null)}
                        className="ml-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                      >
                        ✗
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-gray-900">{service.nom}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditService(service.id, service.nom)}
                          className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Onglet Personnel */}
        {ongletActif === 'personnel' && (
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
                  {personnelEnEdition === p.id ? (
                    <>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={personnelEdition.nom}
                          onChange={(e) => setPersonnelEdition({ ...personnelEdition, nom: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={personnelEdition.poste}
                          onChange={(e) => setPersonnelEdition({ ...personnelEdition, poste: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                          value={personnelEdition.service_id}
                          onChange={(e) => setPersonnelEdition({ ...personnelEdition, service_id: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Service</option>
                          {services.map((s) => (
                            <option key={s.id} value={s.id}>{s.nom}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => handleSavePersonnel(p.id)}
                        className="ml-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setPersonnelEnEdition(null)}
                        className="ml-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                      >
                        ✗
                      </button>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="font-medium text-gray-900">{p.nom}</p>
                        <p className="text-sm text-gray-600">{p.poste || 'Non spécifié'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditPersonnel(p.id, p)}
                          className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={() => handleDeletePersonnel(p.id)}
                          className="px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Onglet Utilisateurs (PAR-06) */}
        {ongletActif === 'utilisateurs' && <OngletUtilisateurs />}
      </div>
    </div>
  );
}