"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addImmobilisation, getServices, getPersonnels } from "@/app/lib/store";
import QRCode from "qrcode";

export default function AjouterImmobilisationPage() {
  const router = useRouter();
  const [chargement, setChargement] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [personnels, setPersonnels] = useState<any[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [codeInterne, setCodeInterne] = useState("");
  
  const [formData, setFormData] = useState({
    categorie: "",
    nom: "",
    modele: "",
    numeroSerie: "",
    etat: "Neuf",
    montant: "",
    dateAcquisition: "",
    serviceId: "",
    personnelId: "",
    anneeAmortissement: ""
  });

  useEffect(() => {
    const chargerDonnees = async () => {
      const servicesData = await getServices();
      const personnelsData = await getPersonnels();
      setServices(servicesData);
      setPersonnels(personnelsData);
    };
    chargerDonnees();
  }, []);

  const genererCodeInterne = async (serviceNom: string) => {
    const annee = new Date().getFullYear().toString().slice(-2);
    const prefixe = serviceNom ? serviceNom.substring(0, 3).toUpperCase() : "GEN";
    const timestamp = Date.now().toString().slice(-4);
    return `DELO-${annee}-${prefixe}-${timestamp}`;
  };

  const genererQRCode = async (codeInterne: string) => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const equipementUrl = `${siteUrl}/equipement/${codeInterne}`;
    
    const qrCode = await QRCode.toDataURL(equipementUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff"
      }
    });
    
    return qrCode;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);

    try {
      const code = await genererCodeInterne(formData.serviceId);
      setCodeInterne(code);
      
      const nouvelleImmobilisation = await addImmobilisation({
        code_interne: code,
        categorie: formData.categorie,
        nom: formData.nom,
        modele: formData.modele,
        numero_serie: formData.numeroSerie,
        etat: formData.etat,
        montant: parseFloat(formData.montant),
        date_acquisition: formData.dateAcquisition,
        service_id: formData.serviceId,
        personnel_id: formData.personnelId,
        annee_amortissement: parseInt(formData.anneeAmortissement)
      });

      const qrCode = await genererQRCode(code);
      setQrCodeUrl(qrCode);

      alert("Équipement ajouté avec succès ! QR Code généré.");
      
      setTimeout(() => {
        router.push("/immobilisations");
      }, 2000);
    } catch (error) {
      console.error("Erreur ajout immobilisation:", error);
      alert("Erreur lors de l'ajout de l'équipement");
    } finally {
      setChargement(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">➕ Ajouter un équipement</h1>
        <p className="text-gray-600">Enregistrez un nouvel équipement et générez son QR Code</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
            <select
              name="categorie"
              value={formData.categorie}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner</option>
              <option value="Informatique">Informatique</option>
              <option value="Mobilier">Mobilier</option>
              <option value="Véhicule">Véhicule</option>
              <option value="Électronique">Électronique</option>
              <option value="Outillage">Outillage</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'équipement *</label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              placeholder="Ex: Ordinateur Portable Dell"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Modèle</label>
            <input
              type="text"
              name="modele"
              value={formData.modele}
              onChange={handleChange}
              placeholder="Ex: Inspiron 15 3000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de série</label>
            <input
              type="text"
              name="numeroSerie"
              value={formData.numeroSerie}
              onChange={handleChange}
              placeholder="Ex: SN123456789"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">État *</label>
            <select
              name="etat"
              value={formData.etat}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Neuf">Neuf</option>
              <option value="Bon état">Bon état</option>
              <option value="Usagé">Usagé</option>
              <option value="En panne">En panne</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Montant (FCFA) *</label>
            <input
              type="number"
              name="montant"
              value={formData.montant}
              onChange={handleChange}
              placeholder="Ex: 350000"
              required
              min="0"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date d'acquisition *</label>
            <input
              type="date"
              name="dateAcquisition"
              value={formData.dateAcquisition}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service affecté *</label>
            <select
              name="serviceId"
              value={formData.serviceId}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner un service</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Personnel responsable</label>
            <select
              name="personnelId"
              value={formData.personnelId}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner</option>
              {personnels.map((personnel) => (
                <option key={personnel.id} value={personnel.id}>
                  {personnel.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Années d'amortissement</label>
            <input
              type="number"
              name="anneeAmortissement"
              value={formData.anneeAmortissement}
              onChange={handleChange}
              placeholder="Ex: 5"
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={chargement}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {chargement ? "Enregistrement..." : "💾 Enregistrer et générer QR Code"}
          </button>
          
          <button
            type="button"
            onClick={() => router.push("/immobilisations")}
            className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Annuler
          </button>
        </div>
      </form>

      {/* Affichage du QR Code généré */}
      {qrCodeUrl && (
        <div className="max-w-md mx-auto mt-8 bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">QR Code généré !</h2>
          <p className="text-gray-600 mb-4">Code interne : <span className="font-mono font-bold">{codeInterne}</span></p>
          <img src={qrCodeUrl} alt="QR Code" className="mx-auto mb-4" />
          <p className="text-sm text-gray-500">
            Scannez ce QR code pour voir les informations de l'équipement
          </p>
        </div>
      )}
    </div>
  );
}