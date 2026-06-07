import { createClient } from '@supabase/supabase-js';

// Récupération des variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Vérification que les variables existent
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Les variables Supabase ne sont pas configurées. Vérifiez le fichier .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour TypeScript
export type Entreprise = {
  id: string;
  nom: string;
  logo_url: string | null;
  couleur_principale: string;
  devise_code: string;
  created_at: string;
};

export type Utilisateur = {
  id: string;
  entreprise_id: string;
  nom: string;
  email: string;
  role: string;
  actif: boolean;
  created_at: string;
};

export type Service = {
  id: string;
  entreprise_id: string;
  nom: string;
  created_at: string;
};

export type Personnel = {
  id: string;
  entreprise_id: string;
  service_id: string;
  nom: string;
  poste: string | null;
  created_at: string;
};

export type Immobilisation = {
  id: string;
  code_interne: string;
  entreprise_id: string;
  categorie: string;
  nom: string;
  modele: string | null;
  numero_serie: string | null;
  etat: string;
  montant: number;
  annee_amortissement: number;
  date_acquisition: string;
  service_id: string | null;
  personnel_id: string | null;
  created_at: string;
};

export type HistoriqueReaffectation = {
  id: string;
  entreprise_id: string;
  immobilisation_id: string;
  ancien_service_id: string | null;
  ancien_personnel_id: string | null;
  nouveau_service_id: string | null;
  nouveau_personnel_id: string | null;
  motif: string | null;
  date_reaffectation: string;
  created_at: string;
};
// ... (gardez tout le code existant)

// === AUTHENTIFICATION ===
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const onAuthStateChange = (callback: (user: any) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
  return subscription;
};