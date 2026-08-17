import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { verifierAdmin } from "@/app/lib/adminGuard";

export async function PATCH(req: Request, ctx: any) {
  const garde = await verifierAdmin(req);
  if (!garde.ok) return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });

  const params = await ctx.params;
  const { role, actif, password } = await req.json();

  if (password) {
    if (password.length < 6) return NextResponse.json({ error: "Mot de passe trop court (6 min)." }, { status: 400 });
    const { error } = await supabaseAdmin.auth.admin.updateUserById(params.id, { password });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const patch: any = {};
  if (role !== undefined) patch.role = role;
  if (actif !== undefined) patch.actif = actif;
  if (Object.keys(patch).length) {
    const { error } = await supabaseAdmin.from('utilisateurs').update(patch).eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}