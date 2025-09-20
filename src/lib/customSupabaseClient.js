import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.');
}

const clientOptions = {};
// Allow overriding Functions URL in dev (e.g., local functions serve)
try {
  const overrideUrl = import.meta?.env?.VITE_SUPABASE_FUNCTIONS_URL;
  if (overrideUrl) {
    clientOptions.functions = { url: overrideUrl };
    // eslint-disable-next-line no-console
    console.log('[Supabase] Using custom Functions URL:', overrideUrl);
  }
} catch (_) {}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions);
