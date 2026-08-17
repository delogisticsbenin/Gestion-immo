import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { verifierAdmin } from "@/app/lib/adminGuard";

export async function GET(req: Request) {
  const garde = await verifierAdmin(req);
  if (!garde.ok) return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });

  // Amorce : garantit une ligne pour le compte connecté (compte hérité)
  const { data: existant } = await supabaseAdmin
    .from('utilisateurs').select('*').eq('email', garde.email).single();
  if (!existant) {
    await supabaseAdmin.from('utilisateurs').insert([{
      id: garde.userId, nom: "Administrateur", email: garde.email, role: 'administrateur', actif: true,
    }]);
  }

  const { data, error } = await supabaseAdmin.from('utilisateurs').select('*').order('created_at');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  const garde = await verifierAdmin(req);
  if (!garde.ok) return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });

  const { nom, email, password, role } = await req.json();
  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: "Email requis et mot de passe d'au moins 6 caractères." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { nom: nom || "" },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { error: errIns } = await supabaseAdmin.from('utilisateurs').insert([{
    id: data.user.id, nom: nom || "", email, role: role || 'gestionnaire', actif: true,
  }]);
  if (errIns) return NextResponse.json({ error: errIns.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}