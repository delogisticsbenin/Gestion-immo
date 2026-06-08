import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Immobilisation {
  id: string;
  code_interne: string;
  categorie: string;
  nom: string;
  modele?: string;
  numero_serie?: string;
  etat: string;
  montant: number;
  date_acquisition: string;
  service_id?: string;
  personnel_id?: string;
  annee_amortissement?: number;
  localisation?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Service {
  id: string;
  nom: string;
  description?: string;
  created_at?: string;
}

export interface Personnel {
  id: string;
  nom: string;
  email?: string;
  service_id?: string;
  created_at?: string;
}

// Immobilisations
export const getImmobilisations = async () => {
  const { data, error } = await supabase
    .from('immobilisations')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error("Erreur récupération immobilisations:", error);
    return [];
  }
  
  return data || [];
};

export const getImmobilisationById = async (id: string) => {
  const { data, error } = await supabase
    .from('immobilisations')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error("Erreur récupération immobilisation:", error);
    return null;
  }
  
  return data;
};

export const addImmobilisation = async (immobilisation: Omit<Immobilisation, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('immobilisations')
    .insert([immobilisation])
    .select()
    .single();
  
  if (error) {
    console.error("Erreur ajout immobilisation:", error);
    throw error;
  }
  
  return data;
};

export const updateImmobilisation = async (id: string, immobilisation: Partial<Immobilisation>) => {
  const { data, error } = await supabase
    .from('immobilisations')
    .update(immobilisation)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error("Erreur modification immobilisation:", error);
    throw error;
  }
  
  return data;
};

export const deleteImmobilisation = async (id: string) => {
  const { error } = await supabase
    .from('immobilisations')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error("Erreur suppression immobilisation:", error);
    throw error;
  }
  
  return true;
};

// Services
export const getServices = async () => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('nom');
  
  if (error) {
    console.error("Erreur récupération services:", error);
    return [];
  }
  
  return data || [];
};

export const addService = async (service: Omit<Service, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('services')
    .insert([service])
    .select()
    .single();
  
  if (error) {
    console.error("Erreur ajout service:", error);
    throw error;
  }
  
  return data;
};

export const updateService = async (id: string, service: Partial<Service>) => {
  const { data, error } = await supabase
    .from('services')
    .update(service)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error("Erreur modification service:", error);
    throw error;
  }
  
  return data;
};

export const deleteService = async (id: string) => {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error("Erreur suppression service:", error);
    throw error;
  }
  
  return true;
};

// Personnels
export const getPersonnels = async () => {
  const { data, error } = await supabase
    .from('personnels')
    .select('*')
    .order('nom');
  
  if (error) {
    console.error("Erreur récupération personnels:", error);
    return [];
  }
  
  return data || [];
};

export const addPersonnel = async (personnel: Omit<Personnel, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('personnels')
    .insert([personnel])
    .select()
    .single();
  
  if (error) {
    console.error("Erreur ajout personnel:", error);
    throw error;
  }
  
  return data;
};

export const updatePersonnel = async (id: string, personnel: Partial<Personnel>) => {
  const { data, error } = await supabase
    .from('personnels')
    .update(personnel)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error("Erreur modification personnel:", error);
    throw error;
  }
  
  return data;
};

export const deletePersonnel = async (id: string) => {
  const { error } = await supabase
    .from('personnels')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error("Erreur suppression personnel:", error);
    throw error;
  }
  
  return true;
};

// Utilitaires
export const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(montant);
};

// Initialisation entreprise
export const initEntreprise = () => {
  if (typeof window === 'undefined') return;
  
  // Valeurs par défaut
  const defaultData = {
    nom: 'Dé Logistics',
    logo: '',
    couleurPrincipale: '#1e3a8a',
    devise: 'FCFA'
  };

  // Vérifier si déjà initialisé
  if (!localStorage.getItem('nomEntreprise')) {
    localStorage.setItem('nomEntreprise', defaultData.nom);
  }
  if (!localStorage.getItem('entrepriseLogo')) {
    localStorage.setItem('entrepriseLogo', defaultData.logo);
  }
  if (!localStorage.getItem('couleurPrincipale')) {
    localStorage.setItem('couleurPrincipale', defaultData.couleurPrincipale);
  }
  if (!localStorage.getItem('devise')) {
    localStorage.setItem('devise', defaultData.devise);
  }
};

// Liste des devises disponibles
export const DEVISES = [
  { code: 'FCFA', nom: 'Franc CFA (XOF)', symbole: 'FCFA' },
  { code: 'EUR', nom: 'Euro', symbole: '€' },
  { code: 'USD', nom: 'Dollar US', symbole: '$' },
  { code: 'GBP', nom: 'Livre Sterling', symbole: '£' }
];

// Sauvegarder la devise
export const saveDevise = (devise: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('devise', devise);
  window.dispatchEvent(new Event('storage'));
};

// Alias pour getPersonnel (compatibilité)
export const getPersonnel = getPersonnels;

export const getDevise = () => {
  return {
    code: 'FCFA',
    symbole: 'FCFA'
  };
};

// Données entreprise (localStorage)
export const getEntrepriseData = () => {
  if (typeof window === 'undefined') {
    return {
      nom: 'Dé Logistics',
      logo: '',
      couleurPrincipale: '#1e3a8a',
      devise: 'FCFA'
    };
  }
  
  return {
    nom: localStorage.getItem('nomEntreprise') || 'Dé Logistics',
    logo: localStorage.getItem('entrepriseLogo') || '',
    couleurPrincipale: localStorage.getItem('couleurPrincipale') || '#1e3a8a',
    devise: localStorage.getItem('devise') || 'FCFA'
  };
};

export const updateEntrepriseData = (data: Partial<{
  nom: string;
  logo: string;
  couleurPrincipale: string;
  devise: string;
}>) => {
  if (typeof window === 'undefined') return;
  
  if (data.nom !== undefined) localStorage.setItem('nomEntreprise', data.nom);
  if (data.logo !== undefined) localStorage.setItem('entrepriseLogo', data.logo);
  if (data.couleurPrincipale !== undefined) localStorage.setItem('couleurPrincipale', data.couleurPrincipale);
  if (data.devise !== undefined) localStorage.setItem('devise', data.devise);
  
  window.dispatchEvent(new Event('storage'));
};