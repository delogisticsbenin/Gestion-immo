import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Immobilisation {
  id: string;
  code_interne: string;
  nom: string;
  categorie: string;
  modele: string;
  numero_serie: string;
  montant: number;
  date_acquisition: string;
  service_affecte: string;
  personnel_affecte: string;
  etat: string;
  annee_amortissement: number;
  localisation: string;
  description: string;
}

export default async function EquipementPage({ params }: { params: { id: string } }) {
  const { data: immobilisation, error } = await supabase
    .from('immobilisations')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !immobilisation) {
    notFound();
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(montant);
  };

  const getEtatColor = (etat: string) => {
    switch (etat) {
      case 'Neuf': return 'bg-green-100 text-green-800 border-green-200';
      case 'Bon état': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Usagé': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'En panne': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
              <span className="text-4xl">📦</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{immobilisation.nom}</h1>
            <p className="text-lg text-gray-600 font-mono">{immobilisation.code_interne}</p>
          </div>

          {/* Badge état */}
          <div className="flex justify-center mb-6">
            <span className={`px-6 py-2 rounded-full text-sm font-semibold border ${getEtatColor(immobilisation.etat)}`}>
              {immobilisation.etat}
            </span>
          </div>

          {/* Catégorie */}
          <div className="text-center mb-6">
            <span className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
              {immobilisation.categorie}
            </span>
          </div>
        </div>

        {/* Informations détaillées */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span>📋</span> Informations détaillées
          </h2>
          
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-4">
              <p className="text-sm text-gray-500 mb-1">Modèle</p>
              <p className="text-lg font-semibold text-gray-900">{immobilisation.modele || 'Non spécifié'}</p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <p className="text-sm text-gray-500 mb-1">Numéro de série</p>
              <p className="text-lg font-semibold text-gray-900 font-mono">{immobilisation.numero_serie || 'Non spécifié'}</p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <p className="text-sm text-gray-500 mb-1">Montant d'acquisition</p>
              <p className="text-lg font-bold text-green-600">{formatMontant(immobilisation.montant)}</p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <p className="text-sm text-gray-500 mb-1">Date d'acquisition</p>
              <p className="text-lg font-semibold text-gray-900">{formatDate(immobilisation.date_acquisition)}</p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <p className="text-sm text-gray-500 mb-1">Service affecté</p>
              <p className="text-lg font-semibold text-gray-900">{immobilisation.service_affecte || 'Non spécifié'}</p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <p className="text-sm text-gray-500 mb-1">Personnel responsable</p>
              <p className="text-lg font-semibold text-gray-900">{immobilisation.personnel_affecte || 'Non spécifié'}</p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <p className="text-sm text-gray-500 mb-1">Localisation</p>
              <p className="text-lg font-semibold text-gray-900">{immobilisation.localisation || 'Non spécifié'}</p>
            </div>

            {immobilisation.description && (
              <div className="border-b border-gray-200 pb-4">
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-lg text-gray-900">{immobilisation.description}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-500 mb-1">Années d'amortissement restantes</p>
              <p className="text-lg font-semibold text-gray-900">{immobilisation.annee_amortissement} an(s)</p>
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div className="text-center text-sm text-gray-500">
          <p>Gestion des Immobilisations - Dé Logistics</p>
          <p className="mt-1">Scanné le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}</p>
        </div>
      </div>
    </div>
  );
}