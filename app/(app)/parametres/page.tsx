"use client";

import { useState, useEffect } from "react";
import { DEVISES, getDevise, saveDevise, type Devise, initEntreprise, getServices, addService, deleteService, getPersonnel, addPersonnel, deletePersonnel } from "@/app/lib/store";

type Utilisateur = {
  id: string;
  nom: string;
  email: string;
  role: string;
  actif: boolean;
};

type Service = {
  id: string;
  nom: string;
};

type Personnel = {
  id: string;
  nom: string;
  poste: string;
  service_id: string;
  service_nom?: string;
};

export default function ParametresPage() {
  const [ongletActif, setOngletActif] = useState("entreprise");

  // État Entreprise
  const [logo, setLogo] = useState<string>("");
  const [nomEntreprise, setNomEntreprise] = useState("Dé Logistics");
  const [couleurPrincipale, setCouleurPrincipale] = useState("#28b4fb");

  // État Devise
  const [devise, setDevise] = useState<Devise>(DEVISES[0]);

  // État Utilisateurs
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ nom: "", email: "", role: "Consultation" });

  // État Services
  const [services, setServices] = useState<Service[]>([]);
  const [nouveauService, setNouveauService] = useState("");

  // État Personnel
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [showPersonnelModal, setShowPersonnelModal] = useState(false);
  const [personnelForm, setPersonnelForm] = useState({ nom: "", poste: "", serviceId: "" });
  const [chargement, setChargement] = useState(true);

  // Charger les données
  const chargerDonnees = async () => {
    setChargement(true);
    await initEntreprise();
    
    // Charger les données du localStorage pour l'entreprise
    const savedLogo = localStorage.getItem("entrepriseLogo");
    const savedNom = localStorage.getItem("nomEntreprise");
    const savedCouleur = localStorage.getItem("couleurPrincipale");
    const savedDevise = localStorage.getItem("devise");

    if (savedLogo) setLogo(savedLogo);
    if (savedNom) setNomEntreprise(savedNom);
    if (savedCouleur) setCouleurPrincipale(savedCouleur);
    if (savedDevise) {
      const parsed = JSON.parse(savedDevise);
      const found = DEVISES.find((d) => d.code === parsed.code);
      if (found) setDevise(found);
    }

    // Charger les services depuis Supabase
    const servicesData = await getServices();
    setServices(servicesData);

    // Charger le personnel depuis Supabase
    const personnelData = await getPersonnel();
    setPersonnel(personnelData);
    
    setChargement(false);
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  // === FONCTIONS ENTREPRISE ===
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const logoUrl = reader.result as string;
        setLogo(logoUrl);
        localStorage.setItem("entrepriseLogo", logoUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const sauvegarderEntreprise = () => {
    localStorage.setItem("nomEntreprise", nomEntreprise);
    localStorage.setItem("couleurPrincipale", couleurPrincipale);
    window.dispatchEvent(new Event("storage"));
    alert("✅ Configuration de l'entreprise sauvegardée !");
  };

  // === FONCTIONS DEVISE ===
  const sauvegarderDevise = () => {
    saveDevise(devise);
    alert(`✅ Devise définie : ${devise.nom} (${devise.symbole})`);
  };

  // === FONCTIONS UTILISATEURS ===
  const ajouterUtilisateur = () => {
    if (!userForm.nom || !userForm.email) {
      alert("Veuillez remplir tous les champs");
      return;
    }
    const newUser: Utilisateur = {
      id: Date.now().toString(),
      ...userForm,
      actif: true,
    };
    setUtilisateurs([...utilisateurs, newUser]);
    setUserForm({ nom: "", email: "", role: "Consultation" });
    setShowUserModal(false);
  };

  const supprimerUtilisateur = (id: string) => {
    if (confirm("Supprimer cet utilisateur ?")) {
      setUtilisateurs(utilisateurs.filter((u) => u.id !== id));
    }
  };

  const toggleUtilisateur = (id: string) => {
    setUtilisateurs(utilisateurs.map((u) =>
      u.id === id ? { ...u, actif: !u.actif } : u
    ));
  };

  // === FONCTIONS SERVICES ===
  const ajouterService = async () => {
    if (!nouveauService.trim()) {
      alert("Veuillez entrer un nom de service");
      return;
    }
    const newService = await addService(nouveauService);
    if (newService) {
      setServices([...services, newService]);
      setNouveauService("");
      alert("✅ Service ajouté avec succès !");
    }
  };

  const supprimerService = async (id: string) => {
    if (confirm("Supprimer ce service ? Le personnel associé sera également supprimé.")) {
      await deleteService(id);
      setServices(services.filter((s) => s.id !== id));
      setPersonnel(personnel.filter((p) => p.service_id !== id));
      alert("✅ Service supprimé !");
    }
  };

  // === FONCTIONS PERSONNEL ===
  const ajouterPersonnel = async () => {
    if (!personnelForm.nom || !personnelForm.serviceId) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }
    const newPersonnel = await addPersonnel(
      personnelForm.nom,
      personnelForm.poste,
      personnelForm.serviceId
    );
    if (newPersonnel) {
      const personnelData = await getPersonnel();
      setPersonnel(personnelData);
      setPersonnelForm({ nom: "", poste: "", serviceId: "" });
      setShowPersonnelModal(false);
      alert("✅ Personnel ajouté avec succès !");
    }
  };

  const supprimerPersonnel = async (id: string) => {
    if (confirm("Supprimer ce membre du personnel ?")) {
      await deletePersonnel(id);
      const personnelData = await getPersonnel();
      setPersonnel(personnelData);
      alert("✅ Personnel supprimé !");
    }
  };

  // Liste des onglets
  const onglets = [
    { id: "entreprise", label: "🏢 Entreprise" },
    { id: "devise", label: "💰 Devise" },
    { id: "services", label: "🏛️ Services" },
    { id: "personnel", label: "👤 Personnel" },
  ];

  if (chargement) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">⚙️ Paramètres</h1>
        <p className="text-gray-500">Configurez votre application</p>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 flex-wrap">
        {onglets.map((onglet) => (
          <button
            key={onglet.id}
            onClick={() => setOngletActif(onglet.id)}
            className={`px-4 py-2 font-medium transition ${
              ongletActif === onglet.id
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {onglet.label}
          </button>
        ))}
      </div>

      {/* Contenu des onglets */}
      <div className="bg-white p-6 rounded-lg shadow">
        
        {/* ONGLET ENTREPRISE */}
        {ongletActif === "entreprise" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Configuration de l'entreprise</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo de l'entreprise</label>
              <div className="flex items-center gap-4">
                {logo ? (
                  <img src={logo} alt="Logo" className="w-24 h-24 object-contain border rounded-lg p-2 bg-white" />
                ) : (
                  <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                    Aucun logo
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block w-full text-sm text-gray-500"
                />
              </div>
              {logo && (
                <button
                  onClick={() => { setLogo(""); localStorage.removeItem("entrepriseLogo"); window.dispatchEvent(new Event("storage")); }}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  Supprimer le logo
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise</label>
              <input
                type="text"
                value={nomEntreprise}
                onChange={(e) => setNomEntreprise(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Couleur principale</label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={couleurPrincipale}
                  onChange={(e) => setCouleurPrincipale(e.target.value)}
                  className="w-16 h-10 border rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={couleurPrincipale}
                  onChange={(e) => setCouleurPrincipale(e.target.value)}
                  className="border border-gray-300 p-2 rounded-lg w-32"
                />
              </div>
            </div>

            <button onClick={sauvegarderEntreprise} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
              💾 Sauvegarder
            </button>
          </div>
        )}

        {/* ONGLET DEVISE */}
        {ongletActif === "devise" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">💰 Configuration de la devise</h2>
            <p className="text-gray-600">Sélectionnez la devise principale utilisée dans l'application.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DEVISES.map((d) => (
                <button
                  key={d.code}
                  onClick={() => setDevise(d)}
                  className={`border-2 rounded-lg p-4 text-left transition ${
                    devise.code === d.code
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-gray-900">{d.symbole}</span>
                    {devise.code === d.code && <span className="text-blue-600 text-xl">✓</span>}
                  </div>
                  <p className="font-semibold text-gray-900">{d.nom}</p>
                  <p className="text-sm text-gray-500 font-mono">{d.code}</p>
                </button>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Devise sélectionnée :</strong> {devise.nom} ({devise.symbole})
              </p>
            </div>

            <button onClick={sauvegarderDevise} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
              💾 Sauvegarder la devise
            </button>
          </div>
        )}

        {/* ONGLET SERVICES */}
        {ongletActif === "services" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Gestion des services</h2>
            </div>
            
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={nouveauService}
                onChange={(e) => setNouveauService(e.target.value)}
                placeholder="Nom du nouveau service"
                className="flex-1 border border-gray-300 p-2 rounded-lg"
                onKeyPress={(e) => e.key === "Enter" && ajouterService()}
              />
              <button onClick={ajouterService} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                ➕ Ajouter
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <div key={service.id} className="border border-gray-300 rounded-lg p-4 flex justify-between items-center bg-white">
                  <div>
                    <p className="font-bold text-gray-900">{service.nom}</p>
                    <p className="text-sm text-gray-500">
                      {personnel.filter((p) => p.service_id === service.id).length} membre(s)
                    </p>
                  </div>
                  <button onClick={() => supprimerService(service.id)} className="text-red-600 hover:text-red-800">🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ONGLET PERSONNEL */}
        {ongletActif === "personnel" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Gestion du personnel</h2>
              <button onClick={() => setShowPersonnelModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                ➕ Ajouter du personnel
              </button>
            </div>

            {services.map((service) => {
              const membresService = personnel.filter((p) => p.service_id === service.id);
              if (membresService.length === 0) return null;
              return (
                <div key={service.id} className="mb-6">
                  <h3 className="font-bold text-lg mb-3 text-gray-900 border-b border-gray-200 pb-2">{service.nom}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {membresService.map((membre) => (
                      <div key={membre.id} className="border border-gray-300 rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-900">{membre.nom}</p>
                          {membre.poste && (
                            <p className="text-sm text-gray-600 italic">{membre.poste}</p>
                          )}
                        </div>
                        <button onClick={() => supprimerPersonnel(membre.id)} className="text-red-600 hover:text-red-800">🗑️</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {personnel.length === 0 && (
              <p className="text-gray-500 text-center py-8">Aucun personnel enregistré. Cliquez sur "Ajouter du personnel" pour commencer.</p>
            )}
          </div>
        )}
      </div>

      {/* MODAL AJOUT PERSONNEL */}
      {showPersonnelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Ajouter du personnel</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  value={personnelForm.nom}
                  onChange={(e) => setPersonnelForm({ ...personnelForm, nom: e.target.value })}
                  className="w-full border border-gray-300 p-2 rounded-lg"
                  placeholder="Ex: M. Dupont Jean"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Poste occupé</label>
                <input
                  type="text"
                  value={personnelForm.poste}
                  onChange={(e) => setPersonnelForm({ ...personnelForm, poste: e.target.value })}
                  className="w-full border border-gray-300 p-2 rounded-lg"
                  placeholder="Ex: Directeur, Responsable RH..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service *</label>
                <select
                  value={personnelForm.serviceId}
                  onChange={(e) => setPersonnelForm({ ...personnelForm, serviceId: e.target.value })}
                  className="w-full border border-gray-300 p-2 rounded-lg"
                >
                  <option value="">-- Choisir un service --</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>{service.nom}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPersonnelModal(false)} className="flex-1 bg-gray-300 text-gray-700 p-3 rounded-lg hover:bg-gray-400 transition">
                Annuler
              </button>
              <button onClick={ajouterPersonnel} className="flex-1 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition">
                ✅ Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}