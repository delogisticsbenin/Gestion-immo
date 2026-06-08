"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addImmobilisation, getServices, getPersonnels, supabase } from "@/app/lib/store";
import QRCode from "qrcode";

export default function AjouterImmobilisationPage() {
  const router = useRouter();
  const [chargement, setChargement] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [personnels, setPersonnels] = useState<any[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [codeInterne, setCodeInterne] = useState<string>("");
  const [erreur, setErreur] = useState<string>("");
  
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

  const genererCodeInterne = async () => {
    const annee = new Date().getFullYear().toString().slice(-2);
    
    const { data: existants } = await supabase
      .from('immobilisations')
      .select('code_interne')
      .like('code_interne', `DELO-${annee}-%`);
    
    const numero = (existants?.length || 0) + 1;
    const numeroFormate = numero.toString().padStart(4, '0');
    
    return `DELO-${annee}-${numeroFormate}`;
  };

  const genererQRCode = async (code: string): Promise<string> => {
    try {
      const siteUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : 'https://gestion-immo-zp3l.vercel.app';
      
      const equipementUrl = `${siteUrl}/equipement/${code}`;
      
      console.log("Génération QR Code pour:", equipementUrl);
      
      const qrCodeDataUrl = await QRCode.toDataURL(equipementUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff"
        },
        errorCorrectionLevel: 'M'
      });
      
      console.log("QR Code généré avec succès");
      return qrCodeDataUrl;
    } catch (error) {
      console.error("Erreur génération QR Code:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);
    setErreur("");
    setQrCodeUrl("");
    setCodeInterne("");

    try {
      // Générer un code unique
      let code = await genererCodeInterne();
      
      // Vérifier que le code n'existe pas déjà
      const { data: codeExistant } = await supabase
        .from('immobilisations')
        .select('id')
        .eq('code_interne', code)
        .single();
      
      if (codeExistant) {
        code = `${code}-${Date.now().toString().slice(-2)}`;
      }
      
      console.log("Code interne généré:", code);
      setCodeInterne(code);
      
      // Ajouter l'immobilisation
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
        personnel_id: formData.personnelId || undefined,
        annee_amortissement: parseInt(formData.anneeAmortissement) || 0
      });

      console.log("Immobilisation ajoutée:", nouvelleImmobilisation);
      
      // Générer le QR Code
      try {
        const qrCode = await genererQRCode(code);
        setQrCodeUrl(qrCode);
        console.log("QR Code affiché");
      } catch (qrError) {
        console.error("Erreur QR Code:", qrError);
        setErreur("Équipement ajouté mais erreur lors de la génération du QR Code");
      }

    } catch (error: any) {
      console.error("Erreur ajout immobilisation:", error);
      const message = error?.message || error?.details || JSON.stringify(error);
      setErreur(`Erreur : ${message}`);
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

  const telechargerQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.download = `QR-Code-${codeInterne}.png`;
      link.href = qrCodeUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">➕ Ajouter un équipement</h1>
        <p className="text-gray-600">Enregistrez un nouvel équipement et générez son QR Code</p>
      </div>

      {erreur && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {erreur}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
            <select
              name="categorie"
              value={formData.categorie}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">État *</label>
            <select
              name="etat"
              value={formData.etat}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service affecté *</label>
            <select
              name="serviceId"
              value={formData.serviceId}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Aucun</option>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
      {qrCodeUrl && codeInterne && (
        <div className="max-w-md mx-auto mt-8 bg-white rounded-xl shadow-lg p-8 text-center border-2 border-blue-200">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Équipement ajouté !</h2>
            <p className="text-gray-600 mb-4">Code interne : <span className="font-mono font-bold text-blue-600">{codeInterne}</span></p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block mb-4">
            <img src={qrCodeUrl} alt={`QR Code ${codeInterne}`} className="max-w-full h-auto" />
          </div>
          
          <div className="space-y-3">
            <button
              onClick={telechargerQRCode}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              📥 Télécharger le QR Code
            </button>
            
            <button
              onClick={() => {
                setQrCodeUrl("");
                setCodeInterne("");
                setFormData({
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
              }}
              className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              ➕ Ajouter un autre équipement
            </button>
          </div>
        </div>
      )}
    </div>
  );
}