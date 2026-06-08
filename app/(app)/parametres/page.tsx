"use client";

import { useState, useEffect } from "react";
import { getEntrepriseData, updateEntrepriseData } from "@/app/lib/store";

export default function ParametresPage() {
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [couleurPrincipale, setCouleurPrincipale] = useState("#1e3a8a");
  const [logo, setLogo] = useState("");
  const [devise, setDevise] = useState("FCFA");
  const [sauvegarde, setSauvegarde] = useState(false);

  useEffect(() => {
    const data = getEntrepriseData();
    setNomEntreprise(data.nom);
    setCouleurPrincipale(data.couleurPrincipale);
    setLogo(data.logo);
    setDevise(data.devise);
  }, []);

  const handleSave = () => {
    updateEntrepriseData({
      nom: nomEntreprise,
      couleurPrincipale,
      logo,
      devise
    });
    setSauvegarde(true);
    setTimeout(() => setSauvegarde(false), 3000);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Paramètres</h1>
        <p className="text-gray-600">Personnalisez votre application</p>
      </div>

      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-8">
        {sauvegarde && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            ✓ Paramètres enregistrés avec succès !
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de l'entreprise
            </label>
            <input
              type="text"
              value={nomEntreprise}
              onChange={(e) => setNomEntreprise(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Dé Logistics"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Couleur principale
            </label>
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
                placeholder="#1e3a8a"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo (URL)
            </label>
            <input
              type="text"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
            {logo && (
              <img src={logo} alt="Aperçu" className="mt-4 w-32 h-32 object-cover rounded-lg border" />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Devise
            </label>
            <select
              value={devise}
              onChange={(e) => setDevise(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="FCFA">FCFA (XOF)</option>
              <option value="EUR">Euro (€)</option>
              <option value="USD">Dollar ($)</option>
            </select>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            💾 Enregistrer les paramètres
          </button>
        </div>
      </div>
    </div>
  );
}