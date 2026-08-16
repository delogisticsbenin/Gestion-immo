"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  getImmobilisations, 
  getServices, 
  getPersonnels, 
  formatMontant,
  deleteImmobilisation,
  sortirDuParc
} from "@/app/lib/store";

export default function ImmobilisationsPage() {
  const [immobilisations, setImmobilisations] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [personnels, setPersonnels] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [filtreCategorie, setFiltreCategorie] = useState("");
  const [filtreEtat, setFiltreEtat] = useState("");
  const [filtreService, setFiltreService] = useState("");
  const [afficherSortis, setAfficherSortis] = useState(false);

  // Modale de sortie du parc (IMM-02)
  const [modaleSortie, setModaleSortie] = useState<{ ouvert: boolean; immoId: string; immoCode: string }>({
    ouvert: false,
    immoId: "",
    immoCode: ""
  });
  const [motifSortie, setMotifSortie] = useState("cession");
  const [dateSortie, setDateSortie] = useState(new Date().toISOString().split('T')[0]);
  const [traitement, setTraitement] = useState(false);

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

  // === IMM-02 : sortie du parc ===
  const ouvrirModaleSortie = (id: string, code: string) => {
    setModaleSortie({ ouvert: true, immoId: id, immoCode: code });
    setMotifSortie("cession");
    setDateSortie(new Date().toISOString().split('T')[0]);
  };

  const fermerModaleSortie = () => {
    setModaleSortie({ ouvert: false, immoId: "", immoCode: "" });
  };

  const confirmerSortieParc = async () => {
    setTraitement(true);
    try {
      await sortirDuParc(modaleSortie.immoId, motifSortie, dateSortie);
      alert(`Équipement ${modaleSortie.immoCode} sorti du parc (${motifSortie}).`);
      fermerModaleSortie();
      await chargerDonnees();
    } catch (error) {
      console.error("Erreur sortie du parc:", error);
      alert("Erreur lors de la sortie du parc");
    } finally {
      setTraitement(false);
    }
  };

  // === Suppression réservée aux erreurs de saisie (< 24 h) ===
  const handleDelete = async (id: string, code: string, dateCreation: string) => {
    const heuresEcoulees = (Date.now() - new Date(dateCreation).getTime()) / (1000 * 60 * 60);
    if (heuresEcoulees > 24) {
      alert("Suppression impossible après 24 h : utilisez « Sortir du parc » pour conserver la piste d'audit.");
      return;
    }
    if (!confirm(`Supprimer définitivement l'équipement ${code} (erreur de saisie) ?`)) return;
    try {
      await deleteImmobilisation(id);
      await chargerDonnees();
      alert("Équipement supprimé.");
    } catch (error) {
      console.error("Erreur suppression:", error);
      alert("Erreur lors de la suppression");
    }
  };

  // === Filtres ===
  const immobilisationsFiltrees = immobilisations.filter((immo) => {
    if (!afficherSortis && immo.statut === 'sorti') return false;
    const matchRecherche =
      immo.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      immo.code_interne?.toLowerCase().includes(recherche.toLowerCase());
    const matchCategorie = !filtreCategorie || immo.categorie === filtreCategorie;
    const matchEtat = !filtreEtat || immo.etat === filtreEtat;
    const matchService = !filtreService || immo.service_id === filtreService;
    return matchRecherche && matchCategorie && matchEtat && matchService;
  });

  const getServiceNom = (serviceId: string) => services.find(s => s.id === serviceId)?.nom || "-";
  const getPersonnelNom = (personnelId: string) => personnels.find(p => p.id === personnelId)?.nom || "-";
  const getMotifLibelle = (motif: string) => {
    const motifs: Record<string, string> = {
      cession: 'Cession',
      reforme: 'Réformé',
      mise_au_rebut: 'Mise au rebut',
      perte_vol: 'Perte / vol'
    };
    return motifs[motif] || motif;
  };

  const valeurTotale = immobilisations
    .filter(immo => immo.statut !== 'sorti')
    .reduce((sum, immo) => sum + (immo.montant || 0), 0);

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
      {/* En-tête — sans bouton retour (NAV-04) */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Liste des Immobilisations</h1>
          <p className="text-gray-600">
            {immobilisationsFiltrees.length} équipement(s) • Valeur totale : {formatMontant(valeurTotale)}
          </p>
        </div>
        <Link
          href="/immobilisations/ajouter"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          ➕ Ajouter
        </Link>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">🔍 Filtres et recherche</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Nom, code..."
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
                <option key={service.id} value={service.id}>{service.nom}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={afficherSortis}
                onChange={(e) => setAfficherSortis(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Afficher les sortis</span>
            </label>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Code</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Nom</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Catégorie</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">État</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Statut</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Montant</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Service</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Personnel</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {immobilisationsFiltrees.map((immo) => (
                <tr key={immo.id} className={`hover:bg-gray-50 ${immo.statut === 'sorti' ? 'opacity-50' : ''}`}>
                  <td className="py-3 px-4 text-sm font-mono text-blue-600 font-medium">{immo.code_interne}</td>
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-gray-900">{immo.nom}</p>
                    {immo.modele && <p className="text-xs text-gray-500">{immo.modele}</p>}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{immo.categorie}</td>
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
                  <td className="py-3 px-4">
                    {immo.statut === 'sorti' ? (
                      <div>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-800">
                          {getMotifLibelle(immo.motif_sortie)}
                        </span>
                        {immo.date_sortie && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(immo.date_sortie).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        En service
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-gray-900">{formatMontant(immo.montant)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{getServiceNom(immo.service_id)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{getPersonnelNom(immo.personnel_id)}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      {immo.statut !== 'sorti' && (
                        <button
                          onClick={() => ouvrirModaleSortie(immo.id, immo.code_interne)}
                          className="px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition text-sm font-medium"
                        >
                          📦 Sortir
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(immo.id, immo.code_interne, immo.created_at)}
                        className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                        title="Supprimer (erreur de saisie < 24 h)"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {immobilisationsFiltrees.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">Aucun équipement trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Affichage de {immobilisationsFiltrees.length} sur {immobilisations.length} équipement(s)
          </p>
        </div>
      </div>

      {/* Modale de sortie du parc */}
      {modaleSortie.ouvert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sortir du parc : {modaleSortie.immoCode}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Motif de sortie *</label>
                <select
                  value={motifSortie}
                  onChange={(e) => setMotifSortie(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cession">Cession (vente)</option>
                  <option value="reforme">Réformé</option>
                  <option value="mise_au_rebut">Mise au rebut</option>
                  <option value="perte_vol">Perte ou vol</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date de sortie *</label>
                <input
                  type="date"
                  value={dateSortie}
                  onChange={(e) => setDateSortie(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ L'équipement est archivé (piste d'audit) et exclu des calculs de valeur.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={fermerModaleSortie}
                disabled={traitement}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmerSortieParc}
                disabled={traitement}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium disabled:opacity-50"
              >
                {traitement ? "Traitement..." : "Confirmer la sortie"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}