import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from './supabaseAdmin';

// Vérifie que l'appelant est bien un administrateur actif
export async function verifierAdmin(req: Request): Promise<{ ok: boolean; email: string; userId: string }> {
  const refus = { ok: false, email: "", userId: "" };
  try {
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
    if (!token) return refus;

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data } = await userClient.auth.getUser(token);
    if (!data.user) return refus;

    const email = (data.user.email || '').toLowerCase();
    const { data: profil } = await supabaseAdmin
      .from('utilisateurs').select('role, actif').eq('email', email).single();

    // Compte hérité (pas encore de ligne) = administrateur par défaut
    if (!profil) return { ok: true, email, userId: data.user.id };

    return {
      ok: profil.actif === true && profil.role === 'administrateur',
      email,
      userId: data.user.id,
    };
  } catch {
    return refus;
  }
}