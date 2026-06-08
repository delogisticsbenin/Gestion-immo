import { supabase } from './supabaseClient';

// === TYPES ===
export type Immobilisation = {
  id: string;
  code_interne: string;
  entreprise_id: string;
  categorie: string;
  nom: string;
  modele: string;
  numero_serie: string;
  etat: string;
  montant: number;
  annee_amortissement: number;
  date_acquisition: string;
  service_id: string;
  personnel_id:  string | null; 
  service_nom?: string;
  personnel_nom?: string;
  poste?: string;
};

export type Devise = {
  code: string;
  nom: string;
  symbole: string;
};

export const DEVISES: Devise[] = [
  { code: "XOF", nom: "Franc CFA (UEMOA)", symbole: "FCFA" },
  { code: "XAF", nom: "Franc CFA (CEMAC)", symbole: "FCFA" },
  { code: "EUR", nom: "Euro", symbole: "€" },
  { code: "USD", nom: "Dollar américain", symbole: "$" },
  { code: "GBP", nom: "Livre sterling", symbole: "£" },
  { code: "MAD", nom: "Dirham marocain", symbole: "MAD" },
  { code: "DZD", nom: "Dinar algérien", symbole: "DA" },
  { code: "TND", nom: "Dinar tunisien", symbole: "DT" },
  { code: "CAD", nom: "Dollar canadien", symbole: "CA$" },
  { code: "CHF", nom: "Franc suisse", symbole: "CHF" },
];

// === ENTREPRISE PAR DÉFAUT ===
const ENTREPRISE_DEMO_ID = "00000000-0000-0000-0000-000000000001";

export const initEntreprise = async () => {
  const { data } = await supabase
    .from('entreprises')
    .select('id')
    .eq('id', ENTREPRISE_DEMO_ID)
    .single();

  if (!data) {
    await supabase
      .from('entreprises')
      .insert({
        id: ENTREPRISE_DEMO_ID,
        nom: localStorage.getItem('nomEntreprise') || 'Dé Logistics',
        couleur_principale: localStorage.getItem('couleurPrincipale') || '#28b4fb',
        devise_code: 'XOF',
      });

    const servicesParDefaut = [
      'Direction', 'Ressources Humaines', 'Comptabilité', 
      'Informatique', 'Commercial', 'HSEQ', 'Exploitation'
    ];

    for (const nom of servicesParDefaut) {
      await supabase
        .from('services')
        .insert({ entreprise_id: ENTREPRISE_DEMO_ID, nom });
    }
  }

  return ENTREPRISE_DEMO_ID;
};

// === FONCTIONS UTILITAIRES ===
const nettoyerChaine = (chaine: string): string => {
  return chaine
    .replace(/[^a-zA-ZÀ-ÿ\s]/g, '')
    .replace(/\s+/g, '')
    .toUpperCase();
};

export const genererCodeImmo = async (serviceNom: string): Promise<string> => {
  const nomEntreprise = localStorage.getItem("nomEntreprise") || "ENT";
  const prefixeEntreprise = nettoyerChaine(nomEntreprise).substring(0, 3).padEnd(3, 'X');
  const annee = new Date().getFullYear().toString().slice(-2);
  const sigleService = nettoyerChaine(serviceNom).substring(0, 3).padEnd(3, 'X');

  const { count } = await supabase
    .from('immobilisations')
    .select('*', { count: 'exact', head: true });

  const numero = ((count || 0) + 1).toString().padStart(3, '0');

  return `${prefixeEntreprise}-${annee}-${sigleService}-${numero}`;
};

// === CRUD IMMOBILISATIONS ===
export const getImmobilisations = async (): Promise<Immobilisation[]> => {
  const { data, error } = await supabase
    .from('immobilisations')
    .select(`
      *,
      service_nom:services(nom),
      personnel_nom:personnel(nom, poste)
    `)
    .eq('entreprise_id', ENTREPRISE_DEMO_ID)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur:', error);
    return [];
  }

  return data.map((item: any) => ({
    ...item,
    service_nom: item.service_nom?.nom || '',
    personnel_nom: item.personnel_nom?.nom || '',
    poste: item.personnel_nom?.poste || '',
  }));
};

export const addImmobilisation = async (immo: Partial<Immobilisation>) => {
  const { data, error } = await supabase
    .from('immobilisations')
    .insert({
      entreprise_id: ENTREPRISE_DEMO_ID,
      ...immo,
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur ajout:', error);
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
    console.error('Erreur suppression:', error);
    throw error;
  }
};

export const updateImmobilisation = async (id: string, updates: Partial<Immobilisation>) => {
  const { data, error } = await supabase
    .from('immobilisations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur mise à jour:', error);
    throw error;
  }

  return data;
};

// === SERVICES ===
export const getServices = async () => {
  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('entreprise_id', ENTREPRISE_DEMO_ID)
    .order('nom');

  return data || [];
};

export const addService = async (nom: string) => {
  const { data } = await supabase
    .from('services')
    .insert({ entreprise_id: ENTREPRISE_DEMO_ID, nom })
    .select()
    .single();

  return data;
};

export const deleteService = async (id: string) => {
  await supabase.from('services').delete().eq('id', id);
};

// === PERSONNEL ===
export const getPersonnel = async () => {
  const { data } = await supabase
    .from('personnel')
    .select('*, service_nom:services(nom)')
    .eq('entreprise_id', ENTREPRISE_DEMO_ID)
    .order('nom');

  return data || [];
};

export const addPersonnel = async (nom: string, poste: string, serviceId: string) => {
  const { data } = await supabase
    .from('personnel')
    .insert({
      entreprise_id: ENTREPRISE_DEMO_ID,
      nom,
      poste,
      service_id: serviceId,
    })
    .select()
    .single();

  return data;
};

export const deletePersonnel = async (id: string) => {
  await supabase.from('personnel').delete().eq('id', id);
};

// === DEVISE ===
export const getDevise = (): Devise => {
  if (typeof window === "undefined") return DEVISES[0];
  const saved = localStorage.getItem("devise");
  if (saved) {
    const parsed = JSON.parse(saved);
    return DEVISES.find((d) => d.code === parsed.code) || DEVISES[0];
  }
  return DEVISES[0];
};

export const saveDevise = (devise: Devise) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("devise", JSON.stringify(devise));
};

export const formatMontant = (montant: number): string => {
  const devise = getDevise();
  const formatted = new Intl.NumberFormat("fr-FR").format(montant);
  return `${formatted} ${devise.symbole}`;
};