"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  getImmobilisations, 
  getServices, 
  getPersonnels, 
  formatMontant,
  deleteImmobilisation 
} from "@/app/lib/store";

export default function ImmobilisationsPage() {
  const router = useRouter();
  const [immobilisations, setImmobilisations] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [personnels, setPersonnels] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [filtreCategorie, setFiltreCategorie] = useState("");
  const [filtreEtat, setFiltreEtat] = useState("");
  const [filtreService, setFiltreService] = useState("");

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setChargement(true);
    try {
      const [immobilisationsData, servicesData, personnelsData] = await Promise.all([
        getImmobilisations(),
        getServices(),
        getPersonnels()
      ]);
      
      setImmobilisations(immobilisationsData);
      setServices(servicesData);
      setPersonnels(personnelsData);
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setChargement(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'équipement ${code} ?`)) return;
    
    try {
      await deleteImmobilisation(id);
      await chargerDonnees();
      alert("Équipement supprimé avec succès");
    } catch (error) {
      console.error("Erreur suppression:", error);
      alert("Erreur lors de la suppression");
    }
  };

  // Filtrer les immobilisations
  const immobilisationsFiltrees = immobilisations.filter((immo) => {
    const matchRecherche = 
      immo.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      immo.code_interne?.toLowerCase().includes(recherche.toLowerCase());
    
    const matchCategorie = !filtreCategorie || immo.categorie === filtreCategorie;
    const matchEtat = !filtreEtat || immo.etat === filtreEtat;
    const matchService = !filtreService || immo.service_id === filtreService;
    
    return matchRecherche && matchCategorie && matchEtat && matchService;
  });

  // Obtenir le nom d'un service par son ID
  const getServiceNom = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service?.nom || "-";
  };

  // Obtenir le nom d'un personnel par son ID
  const getPersonnelNom = (personnelId: string) => {
    const personnel = personnels.find(p => p.id === personnelId);
    return personnel?.nom || "-";
  };

  // Calculer la valeur totale
  const valeurTotale = immobilisations.reduce((sum, immo) => sum + (immo.montant || 0), 0);

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
      {/* En-tête */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Liste des Immobilisations</h1>
          <p className="text-gray-600">
            {immobilisationsFiltrees.length} équipement(s) • Valeur totale : {formatMontant(valeurTotale)}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            ← Dashboard
          </button>
          <Link
            href="/immobilisations/ajouter"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            ➕ Ajouter
          </Link>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>🔍</span> Filtres et recherche
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Nom, code, personnel..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
            <select
              value={filtreCategorie}
              onChange={(e) => setFiltreCategorie(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes</option>
              <option value="Informatique">Informatique</option>
              <option value="Mobilier">Mobilier</option>
              <option value="Véhicule">Véhicule</option>
              <option value="Électronique">Électronique</option>
              <option value="Outillage">Outillage</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">État</label>
            <select
              value={filtreEtat}
              onChange={(e) => setFiltreEtat(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous</option>
              <option value="Neuf">Neuf</option>
              <option value="Bon état">Bon état</option>
              <option value="Usagé">Usagé</option>
              <option value="En panne">En panne</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
            <select
              value={filtreService}
              onChange={(e) => setFiltreService(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">CODE</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">NOM</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">CATÉGORIE</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">ÉTAT</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">MONTANT</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">SERVICE</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">PERSONNEL</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {immobilisationsFiltrees.map((immo) => (
                <tr key={immo.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-mono text-blue-600 font-medium">
                    {immo.code_interne}
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{immo.nom}</p>
                      {immo.modele && <p className="text-xs text-gray-500">{immo.modele}</p>}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {immo.categorie}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      immo.etat === 'Neuf' ? 'bg-green-100 text-green-800' :
                      immo.etat === 'Bon état' ? 'bg-blue-100 text-blue-800' :
                      immo.etat === 'Usagé' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {immo.etat}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                    {formatMontant(immo.montant)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {getServiceNom(immo.service_id)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {getPersonnelNom(immo.personnel_id)}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDelete(immo.id, immo.code_interne)}
                      className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {immobilisationsFiltrees.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    Aucun équipement trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pied de tableau */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Affichage de {immobilisationsFiltrees.length} sur {immobilisations.length} équipement(s)
          </p>
        </div>
      </div>
    </div>
  );
}