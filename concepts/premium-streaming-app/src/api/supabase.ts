import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasSupabase = !!(supabaseUrl && supabaseAnonKey);

if (!hasSupabase) {
  console.warn('[Supabase] Missing env vars — auth disabled. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase: SupabaseClient = createClient(supabaseUrl || '', supabaseAnonKey || '');
export { hasSupabase };
