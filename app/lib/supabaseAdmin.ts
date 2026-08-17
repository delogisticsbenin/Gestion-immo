import { createClient } from '@supabase/supabase-js';

// Client réservé au côté serveur (routes API) — JAMAIS exposé au navigateur
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);