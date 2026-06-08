"use client";
import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  addImmobilisation,
  getDevise,
  genererCodeImmo,
  getServices,
  getPersonnel,
  initEntreprise,
} from "@/app/lib/store";

type Service = { id: string; nom: string };
type Personnel = { id: string; nom: string; poste: string; service_id: string };

export default function AjouterImmobilisation() {
  const [formData, setFormData] = useState({
    categorie: "",
    nom: "",
    modele: "",
    numeroSerie: "",
    etat: "",
    montant: "",
    anneeAmortissement: "",
    dateAcquisition: new Date().toISOString().split("T")[0],
    serviceId: "",
    personnelId: "",
  });

  const [immobilisationCreee, setImmobilisationCreee] = useState<any>(null);
  const [devise, setDevise] = useState(getDevise());
  const [services, setServices] = useState<Service[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [codeApercu, setCodeApercu] = useState("");
  const [chargement, setChargement] = useState(true);

  const categories = ["Informatique", "Mobilier de bureau", "Véhicule", "Outillage", "Électronique"];
  const etats = ["Neuf", "Bon état", "Usagé", "En panne", "Réformé"];

  const chargerDonnees = async () => {
    setChargement(true);
    await initEntreprise();
    setDevise(getDevise());

    const servicesData = await getServices();
    setServices(servicesData);

    const personnelData = await getPersonnel();
    setPersonnel(personnelData);
    setChargement(false);
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  useEffect(() => {
    if (formData.serviceId) {
      const service = services.find((s) => s.id === formData.serviceId);
      if (service) {
        genererCodeImmo(service.nom).then(setCodeApercu);
      }
    } else {
      setCodeApercu("");
    }
  }, [formData.serviceId, services]);

  const personnelsFiltres = formData.serviceId
    ? personnel.filter((p) => p.service_id === formData.serviceId)
    : [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "serviceId" ? { personnelId: "" } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const service = services.find((s) => s.id === formData.serviceId);
    if (!service) {
      alert("Veuillez sélectionner un service");
      return;
    }

    const codeInterne = await genererCodeImmo(service.nom);
    const urlQR = `${window.location.origin}/scan/${codeInterne}`;

    const personnelSelectionne = personnelsFiltres.find((p) => p.id === formData.personnelId);

    try {
      const nouvelleImmo = await addImmobilisation({
        code_interne: codeInterne,
        categorie: formData.categorie,
        nom: formData.nom,
        modele: formData.modele,
        numero_serie: formData.numeroSerie,
        etat: formData.etat,
        montant: Number(formData.montant),
        annee_amortissement: Number(formData.anneeAmortissement),
        date_acquisition: formData.dateAcquisition,
        service_id: formData.serviceId,
        personnel_id: formData.personnelId || undefined,  // ✅ CORRIGÉ ICI
      });

      setImmobilisationCreee({
        ...nouvelleImmo,
        urlQR,
        service_nom: service.nom,
        personnel_nom: personnelSelectionne?.nom || "",
      });
    } catch (error) {
      alert("Erreur lors de l'ajout : " + (error as Error).message);
    }
  };

  const handlePrint = () => window.print();

  const handleNouveau = () => {
    setFormData({
      categorie: "",
      nom: "",
      modele: "",
      numeroSerie: "",
      etat: "",
      montant: "",
      anneeAmortissement: "",
      dateAcquisition: new Date().toISOString().split("T")[0],
      serviceId: "",
      personnelId: "",
    });
    setImmobilisationCreee(null);
    setCodeApercu("");
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">➕ Nouvelle Immobilisation</h1>
          <p className="text-gray-600 mt-2">Remplissez les informations de l'équipement pour générer son QR Code</p>
        </div>

        {!immobilisationCreee && (
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">
            {codeApercu && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm text-blue-700 font-medium mb-1">Code qui sera généré :</p>
                <p className="text-2xl font-mono font-bold text-blue-900">{codeApercu}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                <select name="categorie" value={formData.categorie} onChange={handleChange} required className="w-full border border-gray-300 p-2 rounded-lg">
                  <option value="">-- Choisir une catégorie --</option>
                  {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">État *</label>
                <select name="etat" value={formData.etat} onChange={handleChange} required className="w-full border border-gray-300 p-2 rounded-lg">
                  <option value="">-- Choisir un état --</option>
                  {etats.map((etat) => (<option key={etat} value={etat}>{etat}</option>))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'équipement *</label>
                <input type="text" name="nom" value={formData.nom} onChange={handleChange} placeholder="Ex: Ordinateur portable Dell" required className="w-full border border-gray-300 p-2 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modèle</label>
                <input type="text" name="modele" value={formData.modele} onChange={handleChange} placeholder="Ex: Latitude 5420" className="w-full border border-gray-300 p-2 rounded-lg" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de série</label>
              <input type="text" name="numeroSerie" value={formData.numeroSerie} onChange={handleChange} placeholder="Ex: SN123456789" className="w-full border border-gray-300 p-2 rounded-lg" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant ({devise.symbole}) *</label>
                <input type="number" name="montant" value={formData.montant} onChange={handleChange} placeholder="Ex: 1200" required min="0" step="0.01" className="w-full border border-gray-300 p-2 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Année d'amortissement *</label>
                <input type="number" name="anneeAmortissement" value={formData.anneeAmortissement} onChange={handleChange} placeholder="Ex: 5" required min="1" max="30" className="w-full border border-gray-300 p-2 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'acquisition *</label>
                <input type="date" name="dateAcquisition" value={formData.dateAcquisition} onChange={handleChange} required className="w-full border border-gray-300 p-2 rounded-lg" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service *</label>
                <select name="serviceId" value={formData.serviceId} onChange={handleChange} required className="w-full border border-gray-300 p-2 rounded-lg">
                  <option value="">-- Choisir un service --</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>{service.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Personnel affecté *</label>
                <select name="personnelId" value={formData.personnelId} onChange={handleChange} required disabled={!formData.serviceId} className="w-full border border-gray-300 p-2 rounded-lg disabled:bg-gray-100">
                  <option value="">{formData.serviceId ? "-- Choisir une personne --" : "-- Sélectionnez d'abord un service --"}</option>
                  {personnelsFiltres.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom}{p.poste ? ` - ${p.poste}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition">
              ✅ Valider et Générer le QR Code
            </button>
          </form>
        )}

        {immobilisationCreee && (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Immobilisation enregistrée !</h2>
              <p className="text-gray-600 mt-2">Code attribué : <span className="font-mono font-bold text-blue-600 text-lg">{immobilisationCreee.code_interne}</span></p>
            </div>

            <div className="flex justify-center mb-6">
              <QRCodeSVG value={immobilisationCreee.urlQR} size={256} level="H" includeMargin={true} />
            </div>

            <div className="flex gap-4 no-print">
              <button onClick={handlePrint} className="flex-1 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition">
                🖨️ Imprimer le QR Code
              </button>
              <button onClick={handleNouveau} className="flex-1 bg-gray-600 text-white p-3 rounded-lg hover:bg-gray-700 transition">
                ➕ Nouvel équipement
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}